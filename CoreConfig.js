import fs from 'node:fs';
import xmljs from 'xml-js';

for (const env of ['HostedDomain', 'PostgresUsername', 'PostgresPassword', 'PostgresURL']) {
    if (!process.env[env]) {
        console.error(`${env} Environment Variable not set`);
        process.exit(1);
    }
}

const Certificate = {
    CA: 'TAKServer',
    O: 'COTAK',
    OU: 'COTAK-Staging'
};

const config = {
    Configuration: {
        _attributes: {
            xmlns: 'http://bbn.com/marti/xml/config'
        },
        network: {
            _attributes: {
                multicastTTL: "5",
                serverId: "b67d1db9c8fa45738a547c491071d746",
                version: "5.2-RELEASE-16-HEAD",
                cloudwatchEnable: "true",
                cloudwatchName: "cotak-staging"
            },
            input: {
                _attributes: {
                    auth: "x509",
                    _name: "stdssl",
                    protocol: "tls",
                    port: "8089",
                    coreVersion: "2"
                }
            },
            connector: [{
                _attributes: {
                    port: "8443",
                    _name: "https",
                    keystore: "JKS",
                    keystoreFile: "/opt/tak/certs/files/takserver-base.jks",
                    keystorePass: "atakatak"
                }
            },{
                _attributes: {
                     port: "8444",
                     useFederationTruststore: "true",
                     _name: "fed_https"
                 }
            },{
                _attributes: {
                    port: "8446",
                    clientAuth: "false",
                    _name: "cert_https",
                    keystore: "JKS",
                    keystoreFile: "/opt/tak/certs/staging-ops.cotak.gov/staging-ops.cotak.gov.jks",
                    keystorePass: "9VF2kJSzf15UL0GBUv0W",
                    enableNonAdminUI: "false"
                }
            }],
            announce: {
                _attributes: {}
            }
        },
        // TODO: auth: {}
        submission: {
            _attributes: {
                ignoreStaleMessages: "false",
                validateXml: "false"
            }
        },
        submission: {
            _attributes: {
                reloadPersistent: "false"
            }
        },
        repository: {
            _attributes: {
                enable: "true",
                periodMillis: "3000",
                staleDelayMillis: "15000"
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
                enable: "true",
                periodMillis: "3000",
                staleDelayMillis: "15000"
            },
            repeatableType: [{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='911 Alert']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: "911"
                }
            },{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='Ring The Bell']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: "RingTheBell"
                }
            },{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='Geo-fence Breached']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: "GeoFenceBreach"
                }
            },{
                _attributes: {
                    'initiate-test': "/event/detail/emergency[@type='Troops In Contact']",
                    'cancel-test': "/event/detail/emergency[@cancel='true']",
                    _name: "TroopsInContact"
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
            }
        },
        dissemination: {
            _attributes: {
                smartRetry: "false"
            }
        },
        certificateSigning: {
            _attributes: {
                CA: Certificate.CA
            },
            certificateConfig: {
                nameEntries: {
                    nameEntry: [{
                        _attributes: {
                            name: 'O',
                            valie: Certificate.O
                        }
                    },{
                        _attributes: {
                            name: 'OU',
                            valie: Certificate.OU
                        }
                    }]
                }
            }
        },
        federation: {},
        plugins: {},
        cluster: {},
        vbm: {}
    }
}

const xml = xmljs.js2xml(config, {
    spaces: 4,
    compact: true
})

fs.writeFileSync('./CoreConfig.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`);
