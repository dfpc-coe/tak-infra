import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import TypeValidator from './src/type.js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Static } from '@sinclair/typebox';
import CoreConfigType from './src/CoreConfigType.js';
import { randomUUID } from 'node:crypto';
import { toPem } from 'jks-js';
import { diff } from 'json-diff-ts';
import { execSync } from 'node:child_process';
import * as xmljs from 'xml-js';

type BuildOptions = {
    takdir: string,
    tmpdir: string,
    version: string,
    domain: string,
    bucket: string,
    stackName?: string,
    awsRegion?: string,
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

if (import.meta.url === `file://${process.argv[1]}`) {
    for (const env of [
        'HostedDomain',
        'ConfigBucket',
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
        bucket: process.env.ConfigBucket!,
        stackName: process.env.StackName,
        awsRegion: process.env.AWS_REGION,
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
    if (opts.takdir.endsWith('/')) {
        opts.takdir = opts.takdir.slice(0, -1);
    }

    if (opts.tmpdir.endsWith('/')) {
        opts.tmpdir = opts.tmpdir.slice(0, -1);
    }

    const shouldValidateKeystores = !opts.skipKeystoreValidation;

    // Get AWS Root CA as the LDAP Stack is behind an NLB with an AWS Cert
    const Amazon_Root_Cert = await (await fetch('https://www.amazontrust.com/repository/AmazonRootCA1.pem')).text();
    await fsp.writeFile(`${opts.tmpdir}/AmazonRootCA1.pem`, Amazon_Root_Cert);

    execSync(`yes | keytool -import -file ${opts.tmpdir}/AmazonRootCA1.pem -alias AWS -deststoretype JKS -deststorepass INTENTIONALLY_NOT_SENSITIVE -keystore ${opts.tmpdir}/AmazonRootCA1.jks`, {
        stdio: 'inherit'
    });

    // Ensure certs/files/<domain> exists
    await fsp.mkdir(`${opts.takdir}/certs/files/${opts.domain}`, {
        recursive: true
    });

    await fsp.copyFile(`${opts.tmpdir}/AmazonRootCA1.jks`, `${opts.takdir}/certs/files/aws-acm-root.jks`);

    let CoreConfig: Static<typeof CoreConfigType> | null = null;
    let LocalCoreConfig: Static<typeof CoreConfigType> | null = null;

    const s3 = new S3Client({ region: opts.awsRegion || 'us-east-1' });

    try {
        fs.accessSync(`${opts.takdir}/CoreConfig.xml`);

        LocalCoreConfig = xmljs.xml2js(fs.readFileSync(`${opts.takdir}/CoreConfig.xml`, 'utf-8'), {
            compact: true
        }) as Static<typeof CoreConfigType>;
    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            console.error('Local CoreConfig.xml not found - Generating from base');

            fs.writeFileSync(
                `${opts.takdir}/CoreConfig.xml`,
                fs.readFileSync('./CoreConfig.base.xml', 'utf-8')
            );

            LocalCoreConfig = xmljs.xml2js(fs.readFileSync(`${opts.takdir}/CoreConfig.xml`, 'utf-8'), {
                compact: true
            }) as Static<typeof CoreConfigType>;
        } else {
            throw err;
        }
    }

    try {
        LocalCoreConfig = TypeValidator.type(
            CoreConfigType,
            LocalCoreConfig,
            {
                clean: false,
                verbose: true,
                convert: true,
                default: true
            }
        );

    } catch (err) {
        console.error('Local: CoreConfig.xml is invalid, refusing to start');
        throw err;
    }

    try {
        const RemoteConfig = await s3.send(new GetObjectCommand({
            Bucket: opts.bucket,
            Key: 'CoreConfig.xml'
        }));

        if (!RemoteConfig.Body) {
            throw new Error('Remote CoreConfig object contained no body');
        }

        const bodyContents = await RemoteConfig.Body.transformToString();
        CoreConfig = xmljs.xml2js(bodyContents, {
            compact: true
        }) as Static<typeof CoreConfigType>;
    } catch (err) {
        if (isErrorWithName(err, 'NoSuchKey')) {
            console.error('CoreConfig.xml not found in S3 Bucket - Generating');

            CoreConfig = xmljs.xml2js(fs.readFileSync('./CoreConfig.base.xml', 'utf-8'), {
                compact: true
            }) as Static<typeof CoreConfigType>;
        } else {
            throw err;
        }
    }

    if (!CoreConfig) throw new Error('Failed to load Remote CoreConfig');

    try {
        // Ensure seperate objects are created as CoreConfig will be mutated if there are
        // Stack Config values that chage
        CoreConfig = TypeValidator.type(
            CoreConfigType,
            CoreConfig,
            {
                clean: false,
                verbose: true,
                convert: true,
                default: true
            }
        );

    } catch (err) {
        console.error('CoreConfig.xml is invalid, refusing to start');
        throw err;
    }

    if (LocalCoreConfig && LocalCoreConfig.Configuration.filter?.injectionfilter?.uidInject) {
        if (!CoreConfig.Configuration.filter) {
            CoreConfig.Configuration.filter = {};
        }
        if (!CoreConfig.Configuration.filter.injectionfilter) {
            CoreConfig.Configuration.filter.injectionfilter = {};
        }
        CoreConfig.Configuration.filter.injectionfilter.uidInject = LocalCoreConfig.Configuration.filter.injectionfilter.uidInject;
    }

    if (LocalCoreConfig && LocalCoreConfig.Configuration.federation) {
        CoreConfig.Configuration.federation = LocalCoreConfig.Configuration.federation;
    }

    if (CoreConfig.Configuration.network._attributes.serverId === 'REPLACE_ME') {
        CoreConfig.Configuration.network._attributes.serverId = randomUUID();
    }

    if (!CoreConfig.Configuration.network._attributes.version || CoreConfig.Configuration.network._attributes.version !== opts.version) {
        CoreConfig.Configuration.network._attributes.version = opts.version;
    }

    CoreConfig.Configuration.network._attributes.cloudwatchEnable = true;
    CoreConfig.Configuration.network._attributes.cloudwatchName = opts.stackName;

    CoreConfig.Configuration.network.connector = [];

    CoreConfig.Configuration.network.connector.push({
        _attributes: {
            port: 8443,
            _name: 'https',
            keystore: 'JKS',
            keystoreFile: `${opts.takdir}/certs/files/${opts.domain}/letsencrypt.jks`,
            keystorePass: 'atakatak',
            enableNonAdminUI:false,
            enableAdminUI: true,
            enableWebtak: true
        }
    });

    CoreConfig.Configuration.network.connector.push({
        _attributes: {
            port: 8446,
            clientAuth: false,
            _name: 'cert_https',
            keystore: 'JKS',
            keystoreFile: `${opts.takdir}/certs/files/${opts.domain}/letsencrypt.jks`,
            keystorePass: 'atakatak',
            enableNonAdminUI: false,
            enableAdminUI: true,
            enableWebtak: true
        }
    });

    CoreConfig.Configuration.buffer = {
        queue: {
            _attributes: {
                enableStoreForwardChat: true
            },
            priority: {
                _attributes: {}
            }
        },
        latestSA: {
            _attributes: {
                enable: true
            }
        }
    }

    CoreConfig.Configuration.auth.ldap = {
        _attributes: {
            url: opts.ldap.secureUrl,
            userstring: `uid={username},ou=People,${opts.ldap.dn}`,
            updateinterval: 60,
            groupprefix: '',
            groupNameExtractorRegex: 'CN=(.*?)(?:,|$)',
            style: 'DS',
            serviceAccountDN: opts.ldap.serviceUser,
            serviceAccountCredential: opts.ldap.serviceUserPassword,
            groupObjectClass: 'groupOfNames',
            groupBaseRDN: `ou=Group,${opts.ldap.dn}`,
            ldapsTruststore: 'JKS',
            ldapsTruststoreFile: `${opts.takdir}/certs/files/aws-acm-root.jks`,
            ldapsTruststorePass: 'INTENTIONALLY_NOT_SENSITIVE',
            enableConnectionPool: false
        }
    };

    CoreConfig.Configuration.repository.connection = {
        _attributes: {
            url: `jdbc:${opts.postgres.url}`,
            username: opts.postgres.username,
            password: opts.postgres.password
        }
    };

    CoreConfig.Configuration.certificateSigning = {
        _attributes: {
            CA: 'TAKServer'
        },
        certificateConfig: {
            nameEntries: {
                nameEntry: [{
                    _attributes: {
                        name: 'O',
                        value: opts.organization ?? ''
                    }
                },{
                    _attributes: {
                        name: 'OU',
                        value: opts.organizationalUnit ?? ''
                    }
                }]
            }
        },
        TAKServerCAConfig: {
            _attributes: {
                keystore: 'JKS',
                keystoreFile: `${opts.takdir}/certs/files/intermediate-ca-signing.jks`,
                keystorePass: 'atakatak',
                validityDays: '365',
                signatureAlg: 'SHA256WithRSA',
                CAkey: `${opts.takdir}/certs/files/intermediate-ca-signing`,
                CAcertificate: `${opts.takdir}/certs/files/intermediate-ca-signing`
            }
        }
    };

    CoreConfig.Configuration.security = {
        tls: {
            _attributes: {
                keystore: 'JKS',
                keystoreFile: `${opts.takdir}/certs/files/takserver.jks`,
                keystorePass: 'atakatak',
                truststore: 'JKS',
                truststoreFile: `${opts.takdir}/certs/files/truststore-intermediate-ca.jks`,
                truststorePass: 'atakatak',
                context: 'TLSv1.2',
                keymanager: 'SunX509'
            }
        },
        missionTls: {
            _attributes: {
                keystore: 'JKS',
                keystoreFile: `${opts.takdir}/certs/files/truststore-root.jks`,
                keystorePass: 'atakatak'
            }
        }
    }

    if (shouldValidateKeystores) {
        if (CoreConfig.Configuration.network.connector) {
            if (!Array.isArray(CoreConfig.Configuration.network.connector)) {
                CoreConfig.Configuration.network.connector = [ CoreConfig.Configuration.network.connector];
            }

            for (const connector of CoreConfig.Configuration.network.connector) {
                if (connector._attributes.keystoreFile && connector._attributes.keystorePass) {
                    validateKeystore(connector._attributes.keystoreFile, connector._attributes.keystorePass);
                }
            }
        } else {
            console.warn('No Network Connectors Found');
        }

        const certificateSigning = CoreConfig.Configuration.certificateSigning;
        if (certificateSigning?.TAKServerCAConfig) {
            validateKeystore(
                certificateSigning.TAKServerCAConfig._attributes.keystoreFile,
                certificateSigning.TAKServerCAConfig._attributes.keystorePass
            );
        }

        if (CoreConfig.Configuration.auth.ldap) {
            const {
                ldapsTruststoreFile,
                ldapsTruststorePass
            } = CoreConfig.Configuration.auth.ldap._attributes;

            if (ldapsTruststoreFile && ldapsTruststorePass) {
                validateKeystore(ldapsTruststoreFile, ldapsTruststorePass);
            }
        }

        if (CoreConfig.Configuration.security) {
            if (CoreConfig.Configuration.security.tls) {
                validateKeystore(
                    CoreConfig.Configuration.security.tls._attributes.keystoreFile,
                    CoreConfig.Configuration.security.tls._attributes.keystorePass
                );
            }

            if (CoreConfig.Configuration.security.missionTls) {
                validateKeystore(
                    CoreConfig.Configuration.security.missionTls._attributes.keystoreFile,
                    CoreConfig.Configuration.security.missionTls._attributes.keystorePass
                );
            }
        }
    }

    const xml = xmljs.js2xml(CoreConfig, {
        spaces: 4,
        compact: true
    });

    fs.writeFileSync(
        `${opts.takdir}/CoreConfig.xml`,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`
    );

    try {
        console.log('ok - TAK Server - Checking for Diff in CoreConfig.xml');

        await fsp.stat(`${opts.takdir}/CoreConfig.xml`);

        const LocalCoreConfig = xmljs.xml2js(fs.readFileSync('./CoreConfig.base.xml', 'utf-8'), {
            compact: true
        }) as Static<typeof CoreConfigType>;

        const diffs = diff(CoreConfig, LocalCoreConfig);

        if (diffs.length > 0) {
            console.log('ok - TAK Server - CoreConfig.xml change detected');
            const formattedDiffs = diffs.map((change) => JSON.stringify(change, null, 2));
            console.log(formattedDiffs.join('\n'));

            await fsp.writeFile(`${opts.takdir}/CoreConfig.xml`, xmljs.js2xml(CoreConfig, {
                compact: true
            }));

            await s3.send(new PutObjectCommand({
                Bucket: opts.bucket,
                Key: 'CoreConfig.xml',
                Body: fs.createReadStream(`${opts.takdir}/CoreConfig.xml`)
            }));
        } else {
            console.log('ok - TAK Server - No CoreConfig.xml change detected');
        }

    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            console.log('ok - TAK Server - No existing CoreConfig.xml, creating new one');
            await fsp.writeFile(`${opts.takdir}/CoreConfig.xml`, xmljs.js2xml(CoreConfig, {
                compact: true
            }));

            await s3.send(new PutObjectCommand({
                Bucket: opts.bucket,
                Key: 'CoreConfig.xml',
                Body: fs.createReadStream(`${opts.takdir}/CoreConfig.xml`)
            }));
        } else {
            throw err;
        }
    }
}

function validateKeystore(file: string, pass: string) {
    fs.accessSync(file);
    const jksBuffer = fs.readFileSync(file);
    toPem(jksBuffer, pass);
}

function isErrorWithName(error: unknown, name: string): error is { name: string } {
    return typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === name;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && 'code' in error;
}
