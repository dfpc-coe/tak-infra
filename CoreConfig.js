import fs from 'node:fs';
import xmljs from 'xml-js';

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
                    keystoreFile: "/opt/tak/certs/files/staging-ops.cotak.gov.jks",
                    keystorePass: "123"
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
        }
    }
}

const xml = xmljs.js2xml(config, {
    spaces: 4,
    compact: true
})

fs.writeFileSync('./CoreConfig.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`);
