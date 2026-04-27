import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import TypeValidator from './src/type.js';
import type { Static } from '@sinclair/typebox';
import CoreConfigType from './src/CoreConfigType.js';
import { randomUUID } from 'node:crypto';
import { toPem } from 'jks-js';
import { execSync } from 'node:child_process';
import * as xmljs from 'xml-js';

type BuildOptions = {
    takdir: string,
    tmpdir: string,
    version: string,
    domain: string,
    bucket?: string,
    stackName?: string,
    awsRegion?: string,
    configDir?: string,
    organization?: string,
    organizationalUnit?: string,
    skipKeystoreValidation?: boolean,
    postgres: {
        username: string,
        password: string,
        url: string
    },
    ldap: {
        dn: string,
        secureUrl: string,
        serviceUser: string,
        serviceUserPassword: string
    }
};

type XmlObject = {
    _attributes?: Record<string, unknown>,
    [key: string]: unknown
};

if (import.meta.url === `file://${process.argv[1]}`) {
    for (const env of [
        'HostedDomain',
        'PostgresUsername',
        'PostgresPassword',
        'PostgresURL',
        'TAK_VERSION',
        'LDAP_DN',
        'LDAP_SECURE_URL',
        'LDAP_SERVICE_USER',
        'LDAP_SERVICE_USER_PASSWORD',
    ]) {
        if (!process.env[env]) {
            console.error(`${env} Environment Variable not set`);
            process.exit(1);
        }
    }

    await build({
        version: process.env.TAK_VERSION!,
        tmpdir: '/tmp',
        takdir: '/opt/tak',
        domain: process.env.HostedDomain!,
        stackName: process.env.StackName,
        awsRegion: process.env.AWS_REGION,
        configDir: process.env.CoreConfigDirectory,
        organization: process.env.ORGANIZATION,
        organizationalUnit: process.env.ORGANIZATIONAL_UNIT,
        postgres: {
            username: process.env.PostgresUsername!,
            password: process.env.PostgresPassword!,
            url: process.env.PostgresURL!
        },
        ldap: {
            dn: process.env.LDAP_DN!,
            secureUrl: process.env.LDAP_SECURE_URL!,
            serviceUser: process.env.LDAP_SERVICE_USER!,
            serviceUserPassword: process.env.LDAP_SERVICE_USER_PASSWORD!
        }
    });
}

export async function build(
    opts: BuildOptions
) {
    opts.takdir = stripTrailingSlash(opts.takdir);
    opts.tmpdir = stripTrailingSlash(opts.tmpdir);

    const shouldValidateKeystores = !opts.skipKeystoreValidation;
    const canonicalConfigDir = stripTrailingSlash(opts.configDir ?? `${opts.takdir}/config-persist`);
    const canonicalCoreConfigPath = `${canonicalConfigDir}/CoreConfig.xml`;
    const runtimeCoreConfigPath = `${opts.takdir}/CoreConfig.xml`;

    await ensureAmazonRootStore(opts, shouldValidateKeystores);

    await Promise.all([
        fsp.mkdir(`${opts.takdir}/certs/files/${opts.domain}`, {
            recursive: true
        }),
        fsp.mkdir(`${opts.takdir}/certs/amazon-certs`, {
            recursive: true
        }),
        fsp.mkdir(canonicalConfigDir, {
            recursive: true
        })
    ]);

    await fsp.copyFile(`${opts.tmpdir}/AmazonRootCA1.jks`, `${opts.takdir}/certs/amazon-certs/aws-root-ca.jks`);
    await ensureCanonicalCoreConfig(runtimeCoreConfigPath, canonicalCoreConfigPath);

    console.log('ok - TAK Server - Loading canonical CoreConfig.xml from EFS');

    let coreConfig = readCoreConfig(canonicalCoreConfigPath);

    try {
        coreConfig = TypeValidator.type(
            CoreConfigType,
            coreConfig,
            {
                clean: false,
                verbose: true,
                convert: true,
                default: true
            }
        );
    } catch (err) {
        console.error('Canonical CoreConfig.xml is invalid, refusing to start');
        throw err;
    }

    applyDeployConfiguration(coreConfig, opts);

    if (shouldValidateKeystores) {
        validateConfiguredKeystores(coreConfig);
    }

    await fsp.writeFile(canonicalCoreConfigPath, serializeCoreConfig(coreConfig));
    await ensureRuntimeCoreConfigLink(runtimeCoreConfigPath, canonicalCoreConfigPath);

    console.log('ok - TAK Server - CoreConfig.xml synced to canonical EFS storage');
}

async function ensureAmazonRootStore(opts: BuildOptions, shouldValidateKeystores: boolean) {
    const amazonRootJksPath = `${opts.tmpdir}/AmazonRootCA1.jks`;

    if (await pathExists(amazonRootJksPath)) {
        return;
    }

    if (!shouldValidateKeystores) {
        await fsp.writeFile(amazonRootJksPath, '');
        return;
    }

    // Get AWS Root CA as the LDAP Stack is behind an NLB with an AWS Cert.
    const amazonRootCert = await (await fetch('https://www.amazontrust.com/repository/AmazonRootCA1.pem')).text();
    await fsp.writeFile(`${opts.tmpdir}/AmazonRootCA1.pem`, amazonRootCert);

    execSync(`yes | keytool -import -file ${opts.tmpdir}/AmazonRootCA1.pem -alias AWS -deststoretype JKS -deststorepass INTENTIONALLY_NOT_SENSITIVE -keystore ${amazonRootJksPath}`, {
        stdio: 'inherit'
    });
}

async function ensureCanonicalCoreConfig(runtimeCoreConfigPath: string, canonicalCoreConfigPath: string) {
    const runtimeConfigEntry = await lstatIfExists(runtimeCoreConfigPath);

    if (!(await pathExists(canonicalCoreConfigPath))) {
        if (runtimeConfigEntry && runtimeConfigEntry.isFile()) {
            console.log('ok - TAK Server - Migrating existing local CoreConfig.xml to canonical EFS storage');
            await fsp.copyFile(runtimeCoreConfigPath, canonicalCoreConfigPath);
        } else {
            console.log('ok - TAK Server - Canonical CoreConfig.xml not found - Generating from base');
            await fsp.copyFile('./CoreConfig.base.xml', canonicalCoreConfigPath);
        }
    }

    await ensureRuntimeCoreConfigLink(runtimeCoreConfigPath, canonicalCoreConfigPath);
}

async function ensureRuntimeCoreConfigLink(runtimeCoreConfigPath: string, canonicalCoreConfigPath: string) {
    const runtimeConfigEntry = await lstatIfExists(runtimeCoreConfigPath);

    if (runtimeConfigEntry?.isSymbolicLink()) {
        const existingLink = await fsp.readlink(runtimeCoreConfigPath);

        if (existingLink === canonicalCoreConfigPath) {
            return;
        }
    }

    if (runtimeConfigEntry) {
        await fsp.rm(runtimeCoreConfigPath, {
            force: true
        });
    }

    await fsp.symlink(canonicalCoreConfigPath, runtimeCoreConfigPath);
}

function applyDeployConfiguration(coreConfig: Static<typeof CoreConfigType>, opts: BuildOptions) {
    const configuration = (coreConfig as XmlObject).Configuration as XmlObject;
    const network = configuration.network as XmlObject;
    const networkAttributes = ensureAttributes(network);

    if (networkAttributes.serverId === 'REPLACE_ME') {
        networkAttributes.serverId = randomUUID();
    }

    networkAttributes.version = opts.version;
    networkAttributes.cloudwatchEnable = true;
    networkAttributes.cloudwatchName = opts.stackName;

    const letsEncryptKeystore = `${opts.takdir}/certs/files/${opts.domain}/letsencrypt.jks`;
    const httpsConnector = upsertNamedConnector(configuration, 'https');
    Object.assign(ensureAttributes(httpsConnector), {
        port: 8443,
        _name: 'https',
        keystore: 'JKS',
        keystoreFile: letsEncryptKeystore,
        keystorePass: 'atakatak',
        enableNonAdminUI: false,
        enableAdminUI: true,
        enableWebtak: true
    });

    const certHttpsConnector = upsertNamedConnector(configuration, 'cert_https');
    Object.assign(ensureAttributes(certHttpsConnector), {
        port: 8446,
        clientAuth: 'false',
        _name: 'cert_https',
        keystore: 'JKS',
        keystoreFile: letsEncryptKeystore,
        keystorePass: 'atakatak',
        enableNonAdminUI: false,
        enableAdminUI: true,
        enableWebtak: true
    });

    configuration.auth ??= {};
    const auth = configuration.auth as XmlObject;
    auth.ldap ??= { _attributes: {} };
    Object.assign(ensureAttributes(auth.ldap as XmlObject), {
        url: opts.ldap.secureUrl,
        userstring: `cn={username},ou=users,${opts.ldap.dn}`,
        updateinterval: 60,
        groupprefix: 'cn=tak_',
        groupNameExtractorRegex: 'cn=tak_(.*?)(?:,|$)',
        style: 'DS',
        ldapSecurityType: 'simple',
        serviceAccountDN: opts.ldap.serviceUser,
        serviceAccountCredential: opts.ldap.serviceUserPassword,
        groupObjectClass: 'group',
        userObjectClass: 'user',
        groupBaseRDN: `ou=groups,${opts.ldap.dn}`,
        userBaseRDN: `ou=users,${opts.ldap.dn}`,
        ldapsTruststore: 'JKS',
        ldapsTruststoreFile: `${opts.takdir}/certs/amazon-certs/aws-root-ca.jks`,
        ldapsTruststorePass: 'INTENTIONALLY_NOT_SENSITIVE',
        roleAttribute: 'memberOf',
        enableConnectionPool: true
    });

    configuration.repository ??= {};
    const repository = configuration.repository as XmlObject;
    repository.connection ??= { _attributes: {} };
    Object.assign(ensureAttributes(repository.connection as XmlObject), {
        url: `jdbc:${opts.postgres.url}`,
        username: opts.postgres.username,
        password: opts.postgres.password
    });

    configuration.certificateSigning ??= {};
    const certificateSigning = configuration.certificateSigning as XmlObject;
    certificateSigning._attributes ??= {};
    certificateSigning._attributes.CA = 'TAKServer';
    certificateSigning.certificateConfig ??= {};
    const certificateConfig = certificateSigning.certificateConfig as XmlObject;
    certificateConfig.nameEntries ??= {};
    const nameEntriesContainer = certificateConfig.nameEntries as XmlObject;

    const nameEntries = ensureArray(nameEntriesContainer.nameEntry as XmlObject | XmlObject[] | undefined);
    upsertCertificateNameEntry(nameEntries, 'O', opts.organization ?? '');
    upsertCertificateNameEntry(nameEntries, 'OU', opts.organizationalUnit ?? '');
    nameEntriesContainer.nameEntry = nameEntries;

    certificateSigning.TAKServerCAConfig ??= { _attributes: {} };
    Object.assign(ensureAttributes(certificateSigning.TAKServerCAConfig as XmlObject), {
        keystore: 'JKS',
        keystoreFile: `${opts.takdir}/certs/files/intermediate-ca-signing.jks`,
        keystorePass: 'atakatak',
        validityDays: '365',
        signatureAlg: 'SHA256WithRSA',
        CAkey: `${opts.takdir}/certs/files/intermediate-ca-signing`,
        CAcertificate: `${opts.takdir}/certs/files/intermediate-ca-signing`
    });

    configuration.security ??= {};
    const security = configuration.security as XmlObject;
    security.tls ??= { _attributes: {} };
    Object.assign(ensureAttributes(security.tls as XmlObject), {
        keystore: 'JKS',
        keystoreFile: `${opts.takdir}/certs/files/takserver.jks`,
        keystorePass: 'atakatak',
        truststore: 'JKS',
        truststoreFile: `${opts.takdir}/certs/files/truststore-intermediate-ca.jks`,
        truststorePass: 'atakatak',
        context: 'TLSv1.2',
        keymanager: 'SunX509'
    });

    const missionTls = ensureArray(security.missionTls as XmlObject | XmlObject[] | undefined);
    const primaryMissionTls = missionTls[0] ?? { _attributes: {} };
    primaryMissionTls._attributes ??= {};
    Object.assign(primaryMissionTls._attributes, {
        keystore: 'JKS',
        keystoreFile: `${opts.takdir}/certs/files/truststore-root.jks`,
        keystorePass: 'atakatak'
    });
    missionTls[0] = primaryMissionTls;
    security.missionTls = missionTls;
}

function validateConfiguredKeystores(coreConfig: Static<typeof CoreConfigType>) {
    const configuration = (coreConfig as XmlObject).Configuration as XmlObject;
    const network = configuration.network as XmlObject;
    const connectors = ensureArray(network.connector as XmlObject | XmlObject[] | undefined);

    if (connectors.length === 0) {
        console.warn('No Network Connectors Found');
    }

    for (const connector of connectors) {
        const connectorAttributes = connector._attributes;

        if (connectorAttributes?.keystoreFile && connectorAttributes.keystorePass) {
            validateKeystore(
                connectorAttributes.keystoreFile as string,
                connectorAttributes.keystorePass as string
            );
        }
    }

    const certificateSigning = configuration.certificateSigning as XmlObject | undefined;
    const certificateSigningConfig = certificateSigning?.TAKServerCAConfig as XmlObject | undefined;
    if (certificateSigningConfig?._attributes) {
        validateKeystore(
            certificateSigningConfig._attributes.keystoreFile as string,
            certificateSigningConfig._attributes.keystorePass as string
        );
    }

    const auth = configuration.auth as XmlObject | undefined;
    const ldap = auth?.ldap as XmlObject | undefined;
    const ldapAttributes = ldap?._attributes;
    if (ldapAttributes?.ldapsTruststoreFile && ldapAttributes.ldapsTruststorePass) {
        validateKeystore(
            ldapAttributes.ldapsTruststoreFile as string,
            ldapAttributes.ldapsTruststorePass as string
        );
    }

    const security = configuration.security as XmlObject | undefined;
    const tls = security?.tls as XmlObject | undefined;
    if (tls?._attributes) {
        validateKeystore(
            tls._attributes.keystoreFile as string,
            tls._attributes.keystorePass as string
        );
    }

    for (const missionTls of ensureArray(security?.missionTls as XmlObject | XmlObject[] | undefined)) {
        const missionTlsAttributes = missionTls._attributes;

        if (missionTlsAttributes?.keystoreFile && missionTlsAttributes.keystorePass) {
            validateKeystore(
                missionTlsAttributes.keystoreFile as string,
                missionTlsAttributes.keystorePass as string
            );
        }
    }
}

function upsertNamedConnector(configuration: XmlObject, connectorName: string) {
    const network = configuration.network as XmlObject;
    const connectors = ensureArray(network.connector as XmlObject | XmlObject[] | undefined);
    let connector = connectors.find((candidate) => candidate?._attributes?._name === connectorName);

    if (!connector) {
        connector = { _attributes: { _name: connectorName } };
        connectors.push(connector);
    }

    connector._attributes ??= {};
    network.connector = connectors;

    return connector;
}

function upsertCertificateNameEntry(nameEntries: XmlObject[], name: string, value: string) {
    let entry = nameEntries.find((candidate) => candidate?._attributes?.name === name);

    if (!entry) {
        entry = { _attributes: { name } };
        nameEntries.push(entry);
    }

    ensureAttributes(entry).value = value;
}

function ensureAttributes(target: { _attributes?: Record<string, unknown> }) {
    target._attributes ??= {};
    return target._attributes;
}

function ensureArray<T>(value: T | T[] | undefined): T[] {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

function readCoreConfig(filePath: string) {
    return xmljs.xml2js(fs.readFileSync(filePath, 'utf-8'), {
        compact: true
    }) as Static<typeof CoreConfigType>;
}

function serializeCoreConfig(coreConfig: Static<typeof CoreConfigType>) {
    const xml = xmljs.js2xml(coreConfig, {
        spaces: 4,
        compact: true
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`;
}

function stripTrailingSlash(value: string) {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

async function pathExists(filePath: string) {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function lstatIfExists(filePath: string) {
    try {
        return await fsp.lstat(filePath);
    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            return null;
        }

        throw err;
    }
}

function validateKeystore(file: string, pass: string) {
    fs.accessSync(file);
    const jksBuffer = fs.readFileSync(file);
    toPem(jksBuffer, pass);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && 'code' in error;
}
