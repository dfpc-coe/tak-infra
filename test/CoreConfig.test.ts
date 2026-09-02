import { build } from '../CoreConfig.js';
import { test } from 'node:test';
import * as fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import * as xmljs from 'xml-js';
import assert from 'node:assert';

const REQUIRED_ENV: Record<string, string> = {
    HostedDomain: 'test.local',
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
    const takdir = await fsp.mkdtemp(join(tmpdir(), 'tak-'));
    const tmpWorkingDir = await fsp.mkdtemp(join(tmpdir(), 'tmp-'));
    const canonicalConfigDir = join(takdir, 'config-persist');
    const canonicalConfigPath = join(canonicalConfigDir, 'CoreConfig.xml');

    t.after(async () => {
        await Promise.all([
            fsp.rm(takdir, { recursive: true, force: true }),
            fsp.rm(tmpWorkingDir, { recursive: true, force: true })
        ]);
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

    await fsp.mkdir(canonicalConfigDir, { recursive: true });
    await fsp.writeFile(join(tmpWorkingDir, 'AmazonRootCA1.jks'), 'fake-jks');

    const existingConfig = xmljs.xml2js(await fsp.readFile('./CoreConfig.base.xml', 'utf-8'), {
        compact: true
    }) as any;

    existingConfig.Configuration.filter.injectionfilter.uidInject = [{
        _attributes: {
            uid: 'retain-me',
            toInject: 'test-injection'
        }
    }];
    existingConfig.Configuration.federation = {
        _attributes: {
            enableFederation: true
        }
    };
    existingConfig.Configuration.auth.ldap._attributes.url = 'ldaps://old.example.org';
    existingConfig.Configuration.repository.connection._attributes.url = 'jdbc:postgresql://old.example.org:5432/old';

    await fsp.writeFile(canonicalConfigPath, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xmljs.js2xml(existingConfig, {
        compact: true,
        spaces: 4
    })}`);

    await build({
        takdir,
        tmpdir: tmpWorkingDir,
        version: REQUIRED_ENV.TAK_VERSION,
        domain: REQUIRED_ENV.HostedDomain,
        configDir: canonicalConfigDir,
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

    assert.strictEqual(await fsp.realpath(join(takdir, 'CoreConfig.xml')), canonicalConfigPath);

    const coreConfigXml = await fsp.readFile(canonicalConfigPath, 'utf-8');
    const coreConfig = xmljs.xml2js(coreConfigXml, { compact: true }) as any;

    assert.strictEqual(coreConfig.Configuration.network._attributes.version, REQUIRED_ENV.TAK_VERSION);
    assert.strictEqual(coreConfig.Configuration.network._attributes.cloudwatchName, REQUIRED_ENV.StackName);
    assert.strictEqual(coreConfig.Configuration.auth.ldap._attributes.url, REQUIRED_ENV.LDAP_SECURE_URL);
    assert.strictEqual(coreConfig.Configuration.repository.connection._attributes.url, `jdbc:${REQUIRED_ENV.PostgresURL}`);
    assert.strictEqual(coreConfig.Configuration.federation._attributes.enableFederation, 'true');
    const uidInject = Array.isArray(coreConfig.Configuration.filter.injectionfilter.uidInject)
        ? coreConfig.Configuration.filter.injectionfilter.uidInject
        : [coreConfig.Configuration.filter.injectionfilter.uidInject];

    assert.deepStrictEqual(uidInject, [{
        _attributes: {
            uid: 'retain-me',
            toInject: 'test-injection'
        }
    }]);

    const nameEntries = coreConfig.Configuration.certificateSigning.certificateConfig.nameEntries.nameEntry;
    const orgEntry = nameEntries.find((e: any) => e._attributes.name === 'O');
    assert.strictEqual(orgEntry._attributes.value, REQUIRED_ENV.ORGANIZATION);

    const ouEntry = nameEntries.find((e: any) => e._attributes.name === 'OU');
    assert.strictEqual(ouEntry._attributes.value, REQUIRED_ENV.ORGANIZATIONAL_UNIT);

    const connectors = Array.isArray(coreConfig.Configuration.network.connector)
        ? coreConfig.Configuration.network.connector
        : [coreConfig.Configuration.network.connector];

    assert.ok(connectors.some((connector: any) => connector._attributes._name === 'fed_https'));
});

test('CoreConfig Build seeds canonical config from initial secret', async (t) => {
    const takdir = await fsp.mkdtemp(join(tmpdir(), 'tak-'));
    const tmpWorkingDir = await fsp.mkdtemp(join(tmpdir(), 'tmp-'));
    const canonicalConfigDir = join(takdir, 'config-persist');
    const canonicalConfigPath = join(canonicalConfigDir, 'CoreConfig.xml');

    t.after(async () => {
        await Promise.all([
            fsp.rm(takdir, { recursive: true, force: true }),
            fsp.rm(tmpWorkingDir, { recursive: true, force: true })
        ]);
    });

    await fsp.writeFile(join(tmpWorkingDir, 'AmazonRootCA1.jks'), 'fake-jks');

    const initialConfig = xmljs.xml2js(await fsp.readFile('./CoreConfig.base.xml', 'utf-8'), {
        compact: true
    }) as any;
    initialConfig.Configuration.network._attributes.serverId = 'seeded-server';

    const initialCoreConfigXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xmljs.js2xml(initialConfig, {
        compact: true,
        spaces: 4
    })}`;

    await build({
        takdir,
        tmpdir: tmpWorkingDir,
        version: REQUIRED_ENV.TAK_VERSION,
        domain: REQUIRED_ENV.HostedDomain,
        configDir: canonicalConfigDir,
        initialCoreConfigXml,
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

    assert.strictEqual(await fsp.realpath(join(takdir, 'CoreConfig.xml')), canonicalConfigPath);

    const coreConfigXml = await fsp.readFile(canonicalConfigPath, 'utf-8');
    const coreConfig = xmljs.xml2js(coreConfigXml, { compact: true }) as any;

    assert.strictEqual(coreConfig.Configuration.network._attributes.serverId, 'seeded-server');
    assert.strictEqual(coreConfig.Configuration.network._attributes.version, REQUIRED_ENV.TAK_VERSION);
});

test('CoreConfig Build generates from base when no config is present', async (t) => {
    const takdir = await fsp.mkdtemp(join(tmpdir(), 'tak-'));
    const tmpWorkingDir = await fsp.mkdtemp(join(tmpdir(), 'tmp-'));
    const canonicalConfigDir = join(takdir, 'config-persist');
    const canonicalConfigPath = join(canonicalConfigDir, 'CoreConfig.xml');

    t.after(async () => {
        await Promise.all([
            fsp.rm(takdir, { recursive: true, force: true }),
            fsp.rm(tmpWorkingDir, { recursive: true, force: true })
        ]);
    });

    await fsp.writeFile(join(tmpWorkingDir, 'AmazonRootCA1.jks'), 'fake-jks');

    await build({
        takdir,
        tmpdir: tmpWorkingDir,
        version: REQUIRED_ENV.TAK_VERSION,
        domain: REQUIRED_ENV.HostedDomain,
        configDir: canonicalConfigDir,
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

    const coreConfigXml = await fsp.readFile(canonicalConfigPath, 'utf-8');

    assert.ok(coreConfigXml.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Configuration'));
    assert.strictEqual(coreConfigXml.match(/<\?xml/g)?.length, 1);
    assert.ok(!coreConfigXml.includes('REPLACE_ME'));

    const coreConfig = xmljs.xml2js(coreConfigXml, { compact: true }) as any;
    assert.match(coreConfig.Configuration.network._attributes.serverId, /^[0-9a-f-]{36}$/);
    assert.strictEqual(coreConfig.Configuration.certificateSigning._attributes.CA, 'TAKServer');
    assert.strictEqual(coreConfig.Configuration.repository.connection._attributes.password, REQUIRED_ENV.PostgresPassword);
    assert.strictEqual(coreConfig.Configuration.auth.ldap._attributes.serviceAccountDN, REQUIRED_ENV.LDAP_SERVICE_USER);
});

test('CoreConfig Build preserves operator and server edits outside managed attributes', async (t) => {
    const takdir = await fsp.mkdtemp(join(tmpdir(), 'tak-'));
    const tmpWorkingDir = await fsp.mkdtemp(join(tmpdir(), 'tmp-'));
    const canonicalConfigDir = join(takdir, 'config-persist');
    const canonicalConfigPath = join(canonicalConfigDir, 'CoreConfig.xml');

    t.after(async () => {
        await Promise.all([
            fsp.rm(takdir, { recursive: true, force: true }),
            fsp.rm(tmpWorkingDir, { recursive: true, force: true })
        ]);
    });

    await fsp.mkdir(canonicalConfigDir, { recursive: true });
    await fsp.writeFile(join(tmpWorkingDir, 'AmazonRootCA1.jks'), 'fake-jks');

    const existingConfig = xmljs.xml2js(await fsp.readFile('./CoreConfig.base.xml', 'utf-8'), {
        compact: true
    }) as any;

    // Operator tuned attributes that the deploy should not overwrite
    existingConfig.Configuration.certificateSigning.TAKServerCAConfig._attributes.validityDays = '730';
    existingConfig.Configuration.security.tls._attributes.context = 'TLSv1.3';
    existingConfig.Configuration.auth.ldap._attributes.updateinterval = '15';
    existingConfig.Configuration.network.connector.find((c: any) => c._attributes._name === 'https')._attributes.enableNonAdminUI = 'true';

    // Server written sections in shapes that do not match the TypeBox schema
    existingConfig.Configuration.auth.ldap.filtergroup = { _text: 'ops' };
    existingConfig.Configuration.federation = {
        _attributes: { enableFederation: 'true' },
        'federation-outgoing': {
            _attributes: { displayName: 'peer', address: 'peer.example.org', port: '9001' }
        }
    };

    await fsp.writeFile(canonicalConfigPath, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xmljs.js2xml(existingConfig, {
        compact: true,
        spaces: 4
    })}`);

    await build({
        takdir,
        tmpdir: tmpWorkingDir,
        version: REQUIRED_ENV.TAK_VERSION,
        domain: REQUIRED_ENV.HostedDomain,
        configDir: canonicalConfigDir,
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

    const coreConfigXml = await fsp.readFile(canonicalConfigPath, 'utf-8');
    assert.strictEqual(coreConfigXml.match(/<\?xml/g)?.length, 1);

    const coreConfig = xmljs.xml2js(coreConfigXml, { compact: true }) as any;

    assert.strictEqual(coreConfig.Configuration.certificateSigning.TAKServerCAConfig._attributes.validityDays, '730');
    assert.strictEqual(coreConfig.Configuration.certificateSigning.TAKServerCAConfig._attributes.keystoreFile, join(takdir, 'certs/files/intermediate-ca-signing.jks'));
    assert.strictEqual(coreConfig.Configuration.security.tls._attributes.context, 'TLSv1.3');
    assert.strictEqual(coreConfig.Configuration.auth.ldap._attributes.updateinterval, '15');
    assert.strictEqual(coreConfig.Configuration.auth.ldap._attributes.url, REQUIRED_ENV.LDAP_SECURE_URL);
    assert.strictEqual(coreConfig.Configuration.auth.ldap.filtergroup._text, 'ops');
    assert.strictEqual(coreConfig.Configuration.federation['federation-outgoing']._attributes.address, 'peer.example.org');

    const httpsConnector = coreConfig.Configuration.network.connector.find((c: any) => c._attributes._name === 'https');
    assert.strictEqual(httpsConnector._attributes.enableNonAdminUI, 'true');
    assert.strictEqual(httpsConnector._attributes.keystoreFile, join(takdir, 'certs/files', REQUIRED_ENV.HostedDomain, 'letsencrypt.jks'));
});
