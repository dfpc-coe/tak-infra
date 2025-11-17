import { build } from '../CoreConfig.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs';
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
    await build({
        takdir: '/tmp/'
    });
});
