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

if (import.meta.url === `file://${process.argv[1]}`) {
    await build({
        takdir: '/opt/tak'
    });
}

export async function build(
    opts: {
        takdir: string
    }
) {
    // Get AWS Root CA as the LDAP Stack is behind an NLB with an AWS Cert
    const Amazon_Root_Cert = await (await fetch('https://www.amazontrust.com/repository/AmazonRootCA1.pem')).text();
    await fsp.writeFile('/tmp/AmazonRootCA1.pem', Amazon_Root_Cert);

    execSync('yes | keytool -import -file /tmp/AmazonRootCA1.pem -alias AWS -deststoretype JKS -deststorepass INTENTIONALLY_NOT_SENSITIVE -keystore /tmp/AmazonRootCA1.jks', {
        stdio: 'inherit'
    });

    await fsp.copyFile('/tmp/AmazonRootCA1.jks', `${opt.takdir}/certs/files/aws-acm-root.jks`);

    let CoreConfig: Static<typeof CoreConfigType> | null = null;

    const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

    try {
        const RemoteConfig = await s3.send(new GetObjectCommand({
            Bucket: process.env.ConfigBucket,
            Key: 'CoreConfig.xml'
        }));

        const bodyContents = await RemoteConfig.Body.transformToString();
        CoreConfig = xmljs.xml2js(bodyContents, {
            compact: true
        }) as Static<typeof CoreConfigType>;
    } catch (err) {
        if (err.name === 'NoSuchKey') {
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

    if (CoreConfig.Configuration.network._attributes.serverId === 'REPLACE_ME') {
        CoreConfig.Configuration.network._attributes.serverId = randomUUID();
    }

    if (!CoreConfig.Configuration.network._attributes.version || CoreConfig.Configuration.network._attributes.version !== process.env.TAK_VERSION) {
        CoreConfig.Configuration.network._attributes.version = process.env.TAK_VERSION;
    }

    CoreConfig.Configuration.network._attributes.cloudwatchEnable = true;
    CoreConfig.Configuration.network._attributes.cloudwatchName = process.env.StackName;

    CoreConfig.Configuration.network.connector = [];

    CoreConfig.Configuration.network.connector.push({
        _attributes: {
            port: 8443,
            _name: 'https',
            keystore: 'JKS',
            keystoreFile: `${opts.takdir}/certs/files/${process.env.HostedDomain}/letsencrypt.jks`,
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
            keystoreFile: `${opts.takdir}/certs/files/${process.env.HostedDomain}/letsencrypt.jks`,
            keystorePass: 'atakatak',
            enableNonAdminUI: false,
            enableAdminUI: true,
            enableWebtak: true
        }
    });

    CoreConfig.Configuration.auth.ldap = {
        _attributes: {
            url: process.env.LDAP_SECURE_URL,
            userstring: `uid={username},ou=People,${process.env.LDAP_DN}`,
            updateinterval: 60,
            groupprefix: '',
            groupNameExtractorRegex: 'CN=(.*?)(?:,|$)',
            style: 'DS',
            serviceAccountDN: process.env.LDAP_SERVICE_USER,
            serviceAccountCredential: process.env.LDAP_SERVICE_USER_PASSWORD,
            groupObjectClass: 'groupOfNames',
            groupBaseRDN: `ou=Group,${process.env.LDAP_DN}`,
            ldapsTruststore: 'JKS',
            ldapsTruststoreFile: `${opts.takdir}/certs/files/aws-acm-root.jks`,
            ldapsTruststorePass: 'INTENTIONALLY_NOT_SENSITIVE',
            enableConnectionPool: false
        }
    };

    CoreConfig.Configuration.repository.connection = {
        _attributes: {
            url: `jdbc:${process.env.PostgresURL}`,
            username: process.env.PostgresUsername,
            password: process.env.PostgresPassword
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
                        value: process.env.ORGANIZATION
                    }
                },{
                    _attributes: {
                        name: 'OU',
                        value: process.env.ORGANIZATIONAL_UNIT
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

    if (CoreConfig.Configuration.certificateSigning.TAKServerCAConfig) {
        validateKeystore(
            CoreConfig.Configuration.certificateSigning.TAKServerCAConfig._attributes.keystoreFile,
            CoreConfig.Configuration.certificateSigning.TAKServerCAConfig._attributes.keystorePass
        );
    }

    if (CoreConfig.Configuration.auth.ldap) {
        validateKeystore(
            CoreConfig.Configuration.auth.ldap._attributes.ldapsTruststoreFile,
            CoreConfig.Configuration.auth.ldap._attributes.ldapsTruststorePass
        );
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
            console.log(diffs.join('\n'));

            await fsp.writeFile(`${opts.takdir}/CoreConfig.xml`, xmljs.js2xml(CoreConfig, {
                compact: true
            }));

            await s3.send(new PutObjectCommand({
                Bucket: process.env.ConfigBucket,
                Key: 'CoreConfig.xml',
                Body: fs.createReadStream(`${opts.takdir}/CoreConfig.xml`)
            }));
        } else {
            console.log('ok - TAK Server - No CoreConfig.xml change detected');
        }

    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('ok - TAK Server - No existing CoreConfig.xml, creating new one');
            await fsp.writeFile(`${opts.takdir}/CoreConfig.xml`, xmljs.js2xml(CoreConfig, {
                compact: true
            }));

            await s3.send(new PutObjectCommand({
                Bucket: process.env.ConfigBucket,
                Key: 'CoreConfig.xml',
                Body: fs.createReadStream(`${opts.takdir}/CoreConfig.xml`)
            }));
        } else {
            throw err;
        }
    }
}

function validateKeystore(file, pass) {
    fs.accessSync(file);
    const jksBuffer = fs.readFileSync(file);
    toPem(jksBuffer, pass);
}
