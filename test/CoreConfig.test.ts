import { build } from '../CoreConfig.js';
import { test } from 'node:test';
import sinon from 'sinon';
import * as fsp from 'node:fs/promises';
import * as fs from 'node:fs';
import * as childProcess from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const REQUIRED_ENV: Record<string, string> = {
    HostedDomain: 'test.local',
    ConfigBucket: 'test-bucket',
    PostgresUsername: 'postgres',
    PostgresPassword: 'postgres',
    PostgresURL: 'postgresql://example.com:5432/db',
    TAK_VERSION: '1.0.0',
    LDAP_DN: 'dc=example,dc=org',
    LDAP_SECURE_URL: 'ldaps://ldap.example.org',
    LDAP_SERVICE_USER: 'cn=svc,dc=example,dc=org',
    LDAP_SERVICE_USER_PASSWORD: 'svc-password',
    StackName: 'tak-stack',
    ORGANIZATION: 'Example Org',
    ORGANIZATIONAL_UNIT: 'Example Unit',
    AWS_REGION: 'us-east-1'
};

test('CoreConfig Build', async (t) => {
    const sandbox = sinon.createSandbox();

    const takdir = await fsp.mkdtemp(join(tmpdir(), 'tak-'));
    const tmpWorkingDir = await fsp.mkdtemp(join(tmpdir(), 'tmp-'));

    t.after(async () => {
        sandbox.restore();
        await Promise.all([
            fsp.rm(takdir, { recursive: true, force: true }),
            fsp.rm(tmpWorkingDir, { recursive: true, force: true })
        ]);
    });

    sandbox.stub(S3Client.prototype, 'send').callsFake(async (command: unknown) => {
        if (command instanceof GetObjectCommand) {
            const error = new Error('NoSuchKey');
            (error as Error & { name: string }).name = 'NoSuchKey';
            throw error;
        }

        if (command instanceof ListObjectsCommand || command instanceof ListObjectsV2Command) {
            return { Contents: [] };
        }

        if (command instanceof PutObjectCommand) {
            return {};
        }

        return {};
    });

    const keystoreFiles = [
        join(takdir, 'certs/files', REQUIRED_ENV.HostedDomain, 'letsencrypt.jks'),
        join(takdir, 'certs/files', 'intermediate-ca-signing.jks'),
        join(takdir, 'certs/files', 'takserver.jks'),
        join(takdir, 'certs/files', 'truststore-intermediate-ca.jks'),
        join(takdir, 'certs/files', 'truststore-root.jks')
    ];

    await Promise.all(keystoreFiles.map(async (file) => {
        await fsp.mkdir(dirname(file), { recursive: true });
        await fsp.writeFile(file, 'fake-keystore');
    }));

    await build({
        takdir,
        tmpdir: tmpWorkingDir,
        version: REQUIRED_ENV.TAK_VERSION,
        domain: REQUIRED_ENV.HostedDomain,
        bucket: REQUIRED_ENV.ConfigBucket,
        stackName: REQUIRED_ENV.StackName,
        awsRegion: REQUIRED_ENV.AWS_REGION,
        organization: REQUIRED_ENV.ORGANIZATION,
        organizationalUnit: REQUIRED_ENV.ORGANIZATIONAL_UNIT,
        postgres: {
            username: REQUIRED_ENV.PostgresUsername,
            password: REQUIRED_ENV.PostgresPassword,
            url: REQUIRED_ENV.PostgresURL
        },
        ldap: {
            dn: REQUIRED_ENV.LDAP_DN,
            secureUrl: REQUIRED_ENV.LDAP_SECURE_URL,
            serviceUser: REQUIRED_ENV.LDAP_SERVICE_USER,
            serviceUserPassword: REQUIRED_ENV.LDAP_SERVICE_USER_PASSWORD
        },
        skipKeystoreValidation: true
    });
});
