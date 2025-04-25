import { Type } from '@sinclair/typebox';

export default Type.Object({
    Configuration: Type.Object({
        _attributes: Type.Object({
            xmlns: Type.String()
        }),
        network: Type.Object({
            _attributes: Type.Object({
                multicastTTL: Type.Integer(),
                serverId: Type.String(),
                version: Type.String(),
                cloudwatchEnable: Type.Optional(Type.Boolean()),
                cloudwatchName: Type.Optional(Type.String())
            }),
            input: Type.Object({
                _attributes: Type.Object({
                    auth: Type.String(),
                    _name: Type.String(),
                    protocol: Type.String(),
                    port: Type.Integer(),
                    coreVersion: Type.Integer(),
                })
            }),
            connector: Type.Array(Type.Object({
                _attributes: Type.Object({
                    port: Type.Integer(),
                    _name: Type.String(),
                    clientAuth: Type.Optional(Type.Boolean()),
                    keystore: Type.String(),
                    keystoreFile: Type.String(),
                    keystorePass: Type.String(),
                    enableNonAdminUI: Type.Boolean()
                })
            })),
            announce: Type.Object({
                _attributes: Type.Object({})
            })
        }),
        auth: Type.Object({
            _attributes: Type.Object({
                default: Type.String('ldap'),
                x509groups: Type.Boolean(),
                x509addAnonymous: Type.Boolean(),
                x509useGroupCache: Type.Boolean(),
                x509useGroupCacheDefaultActive: Type.Boolean(),
                x509checkRevocation: Type.Boolean()
            }),
            ldap: Type.Object({
                _attributes: Type.Object({
                    url: Type.String(),
                    userstring: Type.String(),
                    updateinterval: Type.Integer(),
                    groupprefix: Type.String(),
                    groupNameExtractorRegex: Type.String(),
                    style: Type.String(),
                    serviceAccountDN: Type.String(),
                    serviceAccountCredential: Type.String(),
                    groupObjectClass: Type.String(),
                    groupBaseRDN: Type.String(),
                    ldapsTruststore: Type.String(),
                    ldapsTruststoreFile: Type.String(),
                    ldapsTruststorePass: Type.String(),
                    enableConnectionPool: Type.Boolean()
                })
            })
        }),
        submission: Type.Object({
            _attributes: Type.Object({
                ignoreStaleMessages: Type.Boolean(),
                validateXml: Type.Boolean(),
            })
        }),
        subscription: Type.Object({
            _attributes: Type.Object({
                reloadPersistent: Type.Boolean()
            })
        }),
        repository: Type.Object({
            _attributes: Type.Object({
                enable: Type.Boolean(),
                numDbConnections: Type.Integer(),
                primaryKeyBatchSize: Type.Integer(),
                insertionBatchSize: Type.Integer()
            }),
            connection: Type.Object({
                _attributes: Type.Object({
                    url: Type.String(),
                    username: Type.String(),
                    password: Type.String(),
                })
            })
        }),
        repeater: Type.Object({
            _attributes: Type.Object({
                enable: Type.Boolean(),
                periodMillis: Type.Integer(),
                staleDelayMillis: Type.Integer(),
            }),
            repeatableType: Type.Array(Type.Object({
                _attributes: Type.Object({
                    'initiate-test': Type.String(),
                    'cancel-test': Type.String(),
                    _name: Type.String()
                })
            }))
        }),
        filter: Type.Object({
            _attributes: Type.Object({})
        }),
        buffer: Type.Object({
            _attributes: Type.Object({}),
            queue: Type.Object({
                _attributes: Type.Object({}),
                priority: Type.Object({
                    _attributes: Type.Object({})
                })
            }),
            latestSA: Type.Object({
                _attributes: Type.Object({
                    enable: Type.Boolean()
                })
            })
        }),
        dissemination: Type.Object({
            _attributes: Type.Object({
                smartRetry: Type.Boolean()
            })
        }),
        certificateSigning: Type.Object({
            _attributes: Type.Object({
                CA: Type.String(),
            }),
            certificateConfig: Type.Object({
                nameEntries: Type.Object({
                    nameEntry: Type.Array(Type.Object({
                        _attributes: Type.Object({
                            name: Type.String(),
                            value: Type.String()
                        })
                    }))
                })
            }),
            TAKServerCAConfig: Type.Object({
                _attributes: Type.Object({
                    keystore: Type.String(),
                    keystoreFile: Type.String(),
                    keystorePass: Type.String(),
                    validityDays: Type.String(),
                    signatureAlg: Type.String(),
                    CAkey: Type.String(),
                    CAcertificate: Type.String()
                })
            })
        }),
        security: Type.Object({
            tls: Type.Object({
                _attributes: Type.Object({
                    keystore: Type.String(),
                    keystoreFile: Type.String(),
                    keystorePass: Type.String(),
                    truststore: Type.String(),
                    truststoreFile: Type.String(),
                    truststorePass: Type.String(),
                    context: Type.String(),
                    keymanager: Type.String(),
                })
            }),
            missionTls: Type.Object({
                _attributes: Type.Object({
                    keystore: Type.String(),
                    keystoreFile: Type.String(),
                    keystorePass: Type.String()
                })
            })
        }),
        locate: Type.Optional(Type.Object({
            _attributes: Type.Object({
                enabled: Type.Boolean(),
                requireLogin: Type.Boolean(),
                group: Type.String(),
                mission: Type.String()
            })
        })),
        plugins: Type.Optional(Type.Object({})),
        cluster: Type.Optional(Type.Object({})),
        vbm: Type.Optional(Type.Object({}))
    })
});
