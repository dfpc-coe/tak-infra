import fs from 'node:fs';
import xmljs from 'xml-js';

for (const env of ['HostedDomain', 'PostgresUsername', 'PostgresPassword', 'PostgresURL', 'TAK_VERSION']) {
    if (!process.env[env]) {
        console.error(`${env} Environment Variable not set`);
        process.exit(1);
    }
}

const Certificate = {
    CA: process.env.StackName || 'TAKServer',
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
                serverId: 'b67d1db9c8fa45738a547c491071d746',
                version: process.env.TAK_VERSION,
                cloudwatchEnable: 'true',
                cloudwatchName: process.env.StackName
            },
            input: {
                _attributes: {
                    auth: 'x509',
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
                    keystorePass: 'atakatak'
                }
            }, {
                _attributes: {
                    port: '8446',
                    clientAuth: 'false',
                    _name: 'cert_https',
                    keystore: 'JKS',
                    keystoreFile: `/opt/tak/certs/${process.env.HostedDomain}/letsencrypt.jks`,
                    keystorePass: 'atakatak',
                    enableNonAdminUI: 'false'
                }
            }],
            announce: {
                _attributes: {}
            }
        },
        // TODO: auth: {}
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
        // TODO: filter: {},
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
                CA: Certificate.CA
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
            }
        },
        security: {
            tls: {
                _attributes: {
                    keystore: 'JKS',
                    keystoreFile: '/opt/tak/certs/files/truststore-root.jks',
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
        federation: {},
        plugins: {},
        cluster: {},
        vbm: {}
    }
};

const xml = xmljs.js2xml(config, {
    spaces: 4,
    compact: true
});

fs.writeFileSync(
    './CoreConfig.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`
);
