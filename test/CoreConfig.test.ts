import { build } from '../CoreConfig.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as xmljs from 'xml-js';

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
    const takdir = await fsp.mkdtemp(join(tmpdir(), Math.random().toString(36).substring(2, 15)));

    t.after(async () => {
        await fsp.rm(takdir, { recursive: true, force: true });
    });

    await build({
        takdir,
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
        }
    });
});
