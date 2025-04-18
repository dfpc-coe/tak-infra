import fs from 'node:fs';
import fsp from 'node:fs/promises';
import jks from 'jks-js';
import $ from 'node:child_process';
import xmljs from 'xml-js';

for (const env of [
    'HostedDomain',
    'PostgresUsername',
    'PostgresPassword',
    'PostgresURL',
    'TAK_VERSION',
    'LDAP_Domain',
    'LDAP_SECURE_URL'
]) {
    if (!process.env[env]) {
        console.error(`${env} Environment Variable not set`);
        process.exit(1);
    }
}

// Get AWS Root CA as the LDAP Stack is behind an NLB with an AWS Cert
const Amazon_Root_Cert = await (await fetch('https://www.amazontrust.com/repository/AmazonRootCA1.pem')).text();
await fsp.writeFile('/tmp/AmazonRootCA1.pem', Amazon_Root_Cert);

$.execSync('yes | keytool -import -file /tmp/AmazonRootCA1.pem -alias AWS -deststoretype JKS -deststorepass INTENTIONALLY_NOT_SENSITIVE -keystore /tmp/AmazonRootCA1.jks', {
    stdio: 'inherit'
});

await fsp.copyFile('/tmp/AmazonRootCA1.jks', '/opt/tak/certs/files/aws-acm-root.jks');

const LDAP_DN = process.env.LDAP_Domain.split('.').map((part) => {
    return `dc=${part}`;
}).join(',');

const Certificate = {
    O: process.env.ORGANIZATION || 'COTAK',
    OU: process.env.ORGANIZATIONAL_UNIT || 'COTAK-Staging'
};

const config = {
    Configuration: {
        _attributes: {
            xmlns: 'http://bbn.com/marti/xml/config'
        },
        network: {
            _attributes: {
                multicastTTL: '5',
                // TODO serverId: 'b67d1db9c8fa45738a547c491071d746',
                version: process.env.TAK_VERSION,
                cloudwatchEnable: 'true',
                cloudwatchName: process.env.StackName
            },
            input: {
                _attributes: {
                    auth: 'ldap',
                    _name: 'stdssl',
                    protocol: 'tls',
                    port: '8089',
                    coreVersion: '2'
                }
            },
            connector: [{
                _attributes: {
                    port: '8443',
                    _name: 'https',
                    keystore: 'JKS',
                    keystoreFile: `/opt/tak/certs/files/${process.env.HostedDomain}/letsencrypt.jks`,
                    keystorePass: 'atakatak',
                    enableNonAdminUI: 'true'
                }
            }, {
                _attributes: {
                    port: '8446',
                    clientAuth: 'false',
                    _name: 'cert_https',
                    keystore: 'JKS',
                    keystoreFile: `/opt/tak/certs/files/${process.env.HostedDomain}/letsencrypt.jks`,
                    keystorePass: 'atakatak',
                    enableNonAdminUI: 'true'
                }
            }],
            announce: {
                _attributes: {}
            }
        },
        auth: {
            _attributes: {
                default: 'ldap',
                x509groups: 'true',
                x509addAnonymous: 'false',
                x509useGroupCache: 'true',
                x509useGroupCacheDefaultActive: 'true',
                x509checkRevocation: 'true'
            },
            ldap: {
                _attributes: {
                    url: process.env.LDAP_SECURE_URL,
                    userstring: `uid={username},ou=People,${LDAP_DN}`,
                    updateinterval: '60',
                    groupprefix: '',
                    groupNameExtractorRegex: 'CN=(.*?)(?:,|$)',
                    style: 'DS',
                    serviceAccountDN: `uid=ldapsvcaccount,${LDAP_DN}`,
                    serviceAccountCredential: process.env.LDAP_Password,
                    groupObjectClass: 'groupOfNames',
                    groupBaseRDN: `ou=Group,${LDAP_DN}`,
                    ldapsTruststore: 'JKS',
                    ldapsTruststoreFile: '/opt/tak/certs/files/aws-acm-root.jks',
                    ldapsTruststorePass: 'INTENTIONALLY_NOT_SENSITIVE',
                    enableConnectionPool: 'false'
                }
            }
        },
        submission: {
            _attributes: {
                ignoreStaleMessages: 'false',
                validateXml: 'false'
            }
        },
        subscription: {
            _attributes: {
                reloadPersistent: 'false'
            }
        },
        repository: {
            _attributes: {
                enable: 'true',
                numDbConnections: '16',
                primaryKeyBatchSize: '500',
                insertionBatchSize: '500'
            },
            connection: {
                _attributes: {
                    url: `jdbc:${process.env.PostgresURL}`,
                    username: process.env.PostgresUsername,
                    password: process.env.PostgresPassword
                }
            }
        },
        repeater: {
            _attributes: {
                enable: 'true',
                periodMillis: '3000',
                staleDelayMillis: '15000'
            },
            repeatableType: [{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='911 Alert']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: '911'
                }
            },{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='Ring The Bell']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: 'RingTheBell'
                }
            },{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='Geo-fence Breached']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: 'GeoFenceBreach'
                }
            },{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='Troops In Contact']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: 'TroopsInContact'
                }
            }]
        },
        filter: {
            _attributes: {}
        },
        buffer: {
            _attributes: {},
            queue: {
                _attributes: {},
                priority: {
                    _attributes: {}
                }
            },
            latestSA: {
                _attributes: {
                    enable: 'true'
                }
            }
        },
        dissemination: {
            _attributes: {
                smartRetry: 'false'
            }
        },
        certificateSigning: {
            _attributes: {
                CA: 'TAKServer'
            },
            certificateConfig: {
                nameEntries: {
                    nameEntry: [{
                        _attributes: {
                            name: 'O',
                            value: Certificate.O
                        }
                    },{
                        _attributes: {
                            name: 'OU',
                            value: Certificate.OU
                        }
                    }]
                }
            },
            TAKServerCAConfig: {
                _attributes: {
                    keystore: 'JKS',
                    keystoreFile: '/opt/tak/certs/files/intermediate-ca-signing.jks',
                    keystorePass: 'atakatak',
                    validityDays: '365',
                    signatureAlg: 'SHA256WithRSA',
                    CAkey: '/opt/tak/certs/files/intermediate-ca-signing',
                    CAcertificate: '/opt/tak/certs/files/intermediate-ca-signing'
                }
            }
        },
        security: {
            tls: {
                _attributes: {
                    keystore: 'JKS',
                    keystoreFile: '/opt/tak/certs/files/takserver.jks',
                    keystorePass: 'atakatak',
                    truststore: 'JKS',
                    truststoreFile: '/opt/tak/certs/files/truststore-intermediate-ca.jks',
                    truststorePass: 'atakatak',
                    context: 'TLSv1.2',
                    keymanager: 'SunX509'
                }
            },
            missionTls: {
                _attributes: {
                    keystore: 'JKS',
                    keystoreFile: '/opt/tak/certs/files/truststore-root.jks',
                    keystorePass: 'atakatak'
                }
            }
        },
        locate: {
            _attributes: {
                enabled: 'true',
                requireLogin: 'false',
                group: 'DEMO - Demonstrations',
                mission: 'cotak-locator'
            }
        },
        plugins: {},
        cluster: {},
        vbm: {}
    }
};

if (config.Configuration.network.connector) {
    if (!config.Configuration.network.connector) {
        config.Configuration.network.connector = [config.Configuration.network.connector];
    }

    for (const connector of config.Configuration.network.connector) {
        if (connector._attributes.keystoreFile && connector._attributes.keystorePass) {
            validateKeystore(connector._attributes.keystoreFile, connector._attributes.keystorePass);
        }
    }
} else {
    console.warn('No Network Connectors Found');
}

if (config.Configuration.certificateSigning.TAKServerCAConfig) {
    validateKeystore(
        config.Configuration.certificateSigning.TAKServerCAConfig._attributes.keystoreFile,
        config.Configuration.certificateSigning.TAKServerCAConfig._attributes.keystorePass
    );
}

if (config.Configuration.auth.ldap) {
    validateKeystore(
        config.Configuration.auth.ldap._attributes.ldapsTruststoreFile,
        config.Configuration.auth.ldap._attributes.ldapsTruststorePass
    );
}

if (config.Configuration.security) {
    if (config.Configuration.security.tls) {
        validateKeystore(
            config.Configuration.security.tls._attributes.keystoreFile,
            config.Configuration.security.tls._attributes.keystorePass
        );
    }

    if (config.Configuration.security.missionTls) {
        validateKeystore(
            config.Configuration.security.missionTls._attributes.keystoreFile,
            config.Configuration.security.missionTls._attributes.keystorePass
        );
    }
}

const xml = xmljs.js2xml(config, {
    spaces: 4,
    compact: true
});

fs.writeFileSync(
    './CoreConfig.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`
);

function validateKeystore(file, pass) {
    fs.accessSync(file);
    const jksBuffer = fs.readFileSync(file);
    jks.toPem(jksBuffer, pass);
}
