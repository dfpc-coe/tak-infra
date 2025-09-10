import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import { Static } from '@sinclair/typebox';
import CoreConfigType from './src/CoreConfigType.js';
import { randomUUID } from 'node:crypto';
import { toPem } from 'jks-js';
import { diff } from 'json-diff-ts';
import { execSync } from 'node:child_process';
import * as xmljs from 'xml-js';

for (const env of [
    'PostgresUsername',
    'PostgresPassword',
    'PostgresURL',
    'TAK_VERSION',
    'LDAP_DN',
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

execSync('yes | keytool -import -file /tmp/AmazonRootCA1.pem -alias AWS -deststoretype JKS -deststorepass INTENTIONALLY_NOT_SENSITIVE -keystore /tmp/AmazonRootCA1.jks', {
    stdio: 'inherit'
});

await fsp.copyFile('/tmp/AmazonRootCA1.jks', '/opt/tak/certs/files/aws-acm-root.jks');

const LetsEncrypt = {
    Domain: process.env.TAKSERVER_QuickConnect_LetsEncrypt_Domain || 'nodomainset'
}

const Certificate = {
    O: process.env.TAKSERVER_CACert_Org || 'TAK',
    OU: process.env.TAKSERVER_CACert_OrgUnit || 'TAK Unit'
};

const InputConfig = {
    Auth: process.env.TAKSERVER_CoreConfig_Network_Input_8089_Auth || 'x509'
};

const Connector = {
    EnableAdminUI8443: stringToBoolean(process.env.TAKSERVER_CoreConfig_Network_Connector_8443_EnableAdminUI) || true,
    EnableNonAdminUI8443: stringToBoolean(process.env.TAKSERVER_CoreConfig_Network_Connector_8443_EnableNonAdminUI) || true,
    EnableWebtak8443: stringToBoolean(process.env.TAKSERVER_CoreConfig_Network_Connector_8443_EnableWebtak) || true,
    EnableAdminUI8446: stringToBoolean(process.env.TAKSERVER_CoreConfig_Network_Connector_8446_EnableAdminUI) || true,
    EnableNonAdminUI8446: stringToBoolean(process.env.TAKSERVER_CoreConfig_Network_Connector_8446_EnableNonAdminUI) || true,
    EnableWebtak8446: stringToBoolean(process.env.TAKSERVER_CoreConfig_Network_Connector_8446_EnableWebtak) || true
};

const LDAP_Auth = {
    X509groups: stringToBoolean(process.env.TAKSERVER_CoreConfig_Auth_X509groups) || true,
    X509addAnonymous: stringToBoolean(process.env.TAKSERVER_CoreConfig_Auth_X509addAnonymous) || false,
    X509useGroupCache: stringToBoolean(process.env.TAKSERVER_CoreConfig_Auth_X509useGroupCache) || true,
    X509useGroupCacheDefaultActive: stringToBoolean(process.env.TAKSERVER_CoreConfig_Auth_X509useGroupCacheDefaultActive) || true,
    X509checkRevocation: stringToBoolean(process.env.TAKSERVER_CoreConfig_Auth_X509checkRevocation) || true,
    LDAP_Userstring: process.env.TAKSERVER_CoreConfig_Auth_LDAP_Userstring || 'cn={username},ou=users,',
    LDAP_Updateinterval: parseInt(process.env.TAKSERVER_CoreConfig_Auth_LDAP_Updateinterval) || 60,
    LDAP_Groupprefix: process.env.TAKSERVER_CoreConfig_Auth_LDAP_Groupprefix || '',
    LDAP_GroupNameExtractorRegex: process.env.TAKSERVER_CoreConfig_Auth_LDAP_GroupNameExtractorRegex || 'CN=(.*?)(?:,|$)',
    LDAP_NestedGroupLookup: stringToBoolean(process.env.TAKSERVER_CoreConfig_Auth_LDAP_NestedGroupLookup) || false,
    LDAP_Style: process.env.TAKSERVER_CoreConfig_Auth_LDAP_Style || 'DS',
    LDAP_ServiceAccountDN: process.env.TAKSERVER_CoreConfig_Auth_LDAP_ServiceAccountDN || 'cn=ldapservice,ou=users,',
    LDAP_UserObjectClass: process.env.TAKSERVER_CoreConfig_Auth_LDAP_UserObjectClass || 'user',
    LDAP_GroupObjectClass: process.env.TAKSERVER_CoreConfig_Auth_LDAP_GroupObjectClass || 'group',
    LDAP_DnAttributeName: process.env.TAKSERVER_CoreConfig_Auth_LDAP_DnAttributeName || 'dn',
    LDAP_NameAttr: process.env.TAKSERVER_CoreConfig_Auth_LDAP_NameAttr || 'cn',
    LDAP_UserBaseRDN: process.env.TAKSERVER_CoreConfig_Auth_LDAP_UserBaseRDN || 'ou=users,',
    LDAP_GroupBaseRDN: process.env.TAKSERVER_CoreConfig_Auth_LDAP_GroupBaseRDN || 'ou=groups,',
    LDAP_CallsignAttribute: process.env.TAKSERVER_CoreConfig_Auth_LDAP_CallsignAttribute || 'takCallsign',
    LDAP_ColorAttribute: process.env.TAKSERVER_CoreConfig_Auth_LDAP_ColorAttribute || 'takColor',
    LDAP_RoleAttribute: process.env.TAKSERVER_CoreConfig_Auth_LDAP_RoleAttribute || 'takRole'

};

const Federation = {
    EnableFederation: stringToBoolean(process.env.TAKSERVER_CoreConfig_Federation_EnableFederation) || true,
    AllowFederatedDelete: stringToBoolean(process.env.TAKSERVER_CoreConfig_Federation_AllowFederatedDelete) || false,
    AllowMissionFederation: stringToBoolean(process.env.TAKSERVER_CoreConfig_Federation_AllowMissionFederation) || true,
    AllowDataFeedFederation: stringToBoolean(process.env.TAKSERVER_CoreConfig_Federation_AllowDataFeedFederation) || true,
    EnableMissionFederationDisruptionTolerance: stringToBoolean(process.env.TAKSERVER_CoreConfig_Federation_EnableMissionFederationDisruptionTolerance) || true,
    MissionFederationDisruptionToleranceRecencySeconds: parseInt(process.env.TAKSERVER_CoreConfig_Federation_MissionFederationDisruptionToleranceRecencySeconds) || 43200,
    EnableDataPackageAndMissionFileFilter: stringToBoolean(process.env.TAKSERVER_CoreConfig_Federation_EnableDataPackageAndMissionFileFilter) || false,
    Federation_WebBaseUrl: process.env.TAKSERVER_CoreConfig_Federation_WebBaseUrl || 'https://localhost:8443/Marti'
};


const RemoteCoreConfig: Static<typeof CoreConfigType> | null = null;
let CoreConfig: Static<typeof CoreConfigType> | null = null;

/* TODO Remote Core Config
    try {
        // Ensure seperate objects are created as CoreConfig will be mutated if there are
        // Stack Config values that chage
        RemoteCoreConfig = TypeValidator.type(
            CoreConfigType,
            xmljs.xml2js(existingCoreConfig.SecretString, { compact: true }),
            {
                clean: false,
                verbose: true,
                convert: true,
                default: true
            }
        );

        CoreConfig = structuredClone(RemoteCoreConfig);
    } catch (err) {
        console.error(err);
    }
*/

if (!CoreConfig) {
    CoreConfig = {
        Configuration: {
            _attributes: {
                xmlns: 'http://bbn.com/marti/xml/config'
            },
            network: {
                _attributes: {
                    multicastTTL: 5,
                    serverId: randomUUID(),
                    version: process.env.TAK_VERSION,
                    cloudwatchEnable: true,
                    cloudwatchName: process.env.StackName
                },
                input: {
                    _attributes: {
                        auth: InputConfig.Auth,
                        _name: 'stdssl',
                        protocol: 'tls',
                        port: 8089,
                        coreVersion: 2
                    }
                },
                connector: [{
                    _attributes: {
                        port: 8443,
                        _name: 'https',
                        keystore: 'JKS',
                        keystoreFile: `/opt/tak/certs/files/${LetsEncrypt.Domain}/letsencrypt.jks`,
                        keystorePass: 'atakatak',
                        enableNonAdminUI: Connector.EnableNonAdminUI8443,
                        enableAdminUI: Connector.EnableAdminUI8443,
                        enableWebtak: Connector.EnableWebtak8443
                    }
                }, {
                    _attributes: {
                        port: 8446,
                        clientAuth: false,
                        _name: 'cert_https',
                        keystore: 'JKS',
                        keystoreFile: `/opt/tak/certs/files/${LetsEncrypt.Domain}/letsencrypt.jks`,
                        keystorePass: 'atakatak',
                        enableNonAdminUI: Connector.EnableNonAdminUI8446,
                        enableAdminUI: Connector.EnableAdminUI8446,
                        enableWebtak: Connector.EnableWebtak8446
                    }
                }],
                announce: {
                    _attributes: {}
                }
            },
            auth: {
                _attributes: {
                    default: 'ldap',
                    x509groups: LDAP_Auth.X509groups,
                    x509addAnonymous: LDAP_Auth.X509addAnonymous,
                    x509useGroupCache: LDAP_Auth.X509useGroupCache,
                    x509useGroupCacheDefaultActive: LDAP_Auth.X509useGroupCacheDefaultActive,
                    x509checkRevocation: LDAP_Auth.X509checkRevocation
                },
                ldap: {
                    _attributes: {
                        url: process.env.LDAP_SECURE_URL,
                        userstring: LDAP_Auth.LDAP_Userstring + process.env.LDAP_DN,
                        updateinterval: LDAP_Auth.LDAP_Updateinterval,
                        groupprefix: LDAP_Auth.LDAP_Groupprefix,
                        groupNameExtractorRegex: LDAP_Auth.LDAP_GroupNameExtractorRegex,
                        style: LDAP_Auth.LDAP_Style,
                        serviceAccountDN: LDAP_Auth.LDAP_ServiceAccountDN + process.env.LDAP_DN,
                        serviceAccountCredential: process.env.LDAP_Password,
                        userObjectClass: LDAP_Auth.LDAP_UserObjectClass,
                        groupObjectClass: LDAP_Auth.LDAP_GroupObjectClass,
                        groupBaseRDN: LDAP_Auth.LDAP_GroupBaseRDN + process.env.LDAP_DN,
                        userBaseRDN: LDAP_Auth.LDAP_UserBaseRDN + process.env.LDAP_DN,
                        dnAttributeName: LDAP_Auth.LDAP_DnAttributeName,
                        nameAttr: LDAP_Auth.LDAP_NameAttr,
                        nestedGroupLookup: LDAP_Auth.LDAP_NestedGroupLookup,
                        callsignAttribute: LDAP_Auth.LDAP_CallsignAttribute,
                        colorAttribute: LDAP_Auth.LDAP_ColorAttribute,
                        roleAttribute: LDAP_Auth.LDAP_RoleAttribute,
                        ldapsTruststore: 'JKS',
                        ldapsTruststoreFile: '/opt/tak/certs/files/aws-acm-root.jks',
                        ldapsTruststorePass: 'INTENTIONALLY_NOT_SENSITIVE',
                        enableConnectionPool: false
                    }
                }
            },
            submission: {
                _attributes: {
                    ignoreStaleMessages: false,
                    validateXml: false
                }
            },
            subscription: {
                _attributes: {
                    reloadPersistent: false
                }
            },
            repository: {
                _attributes: {
                    enable: true,
                    numDbConnections: 16,
                    primaryKeyBatchSize: 500,
                    insertionBatchSize: 500
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
                    enable: true,
                    periodMillis: 3000,
                    staleDelayMillis: 15000
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
                        enable: true
                    }
                }
            },
            dissemination: {
                _attributes: {
                    smartRetry: false
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
            federation: {
                _attributes: {
                    allowFederatedDelete: Federation.AllowFederatedDelete,
                    allowMissionFederation: Federation.AllowMissionFederation,
                    allowDataFeedFederation: Federation.AllowDataFeedFederation,
                    enableMissionFederationDisruptionTolerance: Federation.EnableMissionFederationDisruptionTolerance,
                    missionFederationDisruptionToleranceRecencySeconds: Federation.MissionFederationDisruptionToleranceRecencySeconds,
                    enableFederation: Federation.EnableFederation,
                    enableDataPackageAndMissionFileFilter: Federation.EnableDataPackageAndMissionFileFilter
                },
                'federation-server': {
                    _attributes: {
                        port: 9000,
                        coreVersion: 2,
                        v1enabled: false,
                        v2port: 9001,
                        v2enabled: true,
                        webBaseUrl: Federation.Federation_WebBaseUrl,
                    },
                    tls: {
                        _attributes: {
                            keystore: 'JKS',
                            keystoreFile: '/opt/tak/certs/files/takserver.jks',
                            keystorePass: 'atakatak',
                            truststore: 'JKS',
                            truststoreFile: '/opt/tak/certs/files/fed-truststore.jks',
                            truststorePass: 'atakatak',
                            context: 'TLSv1.2',
                            keymanager: 'SunX509'
                        }
                    },
                    'federation-port': {
                        _attributes: {
                            port: 9000,
                            tlsVersion: 'TLSv1.2'
                        }
                    },
                    v1Tls: [{
                        _attributes: {
                            tlsVersion: 'TLSv1.2'
                        }
                    },{
                        _attributes: {
                            tlsVersion: 'TLSv1.3'
                        }
                    }]
                },
                fileFilter: {
                    fileExtension: ['pref']
                }
            },
            plugins: {},
            cluster: {},
            vbm: {}
        }
    };
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
    '/opt/tak/CoreConfig.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`
);

try {
    console.log('ok - TAK Server - Checking for Diff in CoreConfig.xml');
    const diffs = diff(RemoteCoreConfig, CoreConfig);

    if (diffs.length > 0) {
        console.log('ok - TAK Server - CoreConfig.xml change detected');
    } else {
        console.log('ok - TAK Server - No CoreConfig.xml change detected');
    }
} catch (err) {
    console.error(err);
}

function validateKeystore(file, pass) {
    fs.accessSync(file);
    const jksBuffer = fs.readFileSync(file);
    toPem(jksBuffer, pass);
}

function stringToBoolean(str: string): boolean {
    return str.toLowerCase() === 'true';
}
