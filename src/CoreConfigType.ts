import { Type } from '@sinclair/typebox';

const NetworkConnector = Type.Object({
    _attributes: Type.Object({
        port: Type.Integer(),
        _name: Type.String(),
        clientAuth: Type.Optional(Type.Boolean()),
        keystore: Type.String(),
        keystoreFile: Type.String(),
        keystorePass: Type.String(),
        enableNonAdminUI: Type.Boolean()
    })
})

const Network = Type.Object({
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
    connector: Type.Union([NetworkConnector, Type.Array(NetworkConnector)]),
    announce: Type.Object({
        _attributes: Type.Object({})
    })
})

const Auth = Type.Object({
    _attributes: Type.Object({
        default: Type.String(),
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
})

const Submission = Type.Object({
    _attributes: Type.Object({
        ignoreStaleMessages: Type.Boolean(),
        validateXml: Type.Boolean(),
    })
})

const Subscription = Type.Object({
    _attributes: Type.Object({
        reloadPersistent: Type.Boolean()
    })
})

const Repository = Type.Object({
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
})

const Repeater = Type.Object({
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
})

const Filter = Type.Object({
    _attributes: Type.Object({})
})

const Buff = Type.Object({
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
})

const Dissemination = Type.Object({
    _attributes: Type.Object({
        smartRetry: Type.Boolean()
    })
})

const CertificateSigning = Type.Object({
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
})

const Logging = Type.Object({});

const Security = Type.Object({
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
})

const Ferry = Type.Object({});
const Async = Type.Object({});
const Federation = Type.Object({});
const Geocache = Type.Object({});
const Citrap = Type.Object({});
const Xmpp = Type.Object({});
const Docs = Type.Object({});
const Email = Type.Object({});
const Profile = Type.Object({});

const Locate = Type.Optional(Type.Object({
    _attributes: Type.Object({
        enabled: Type.Boolean(),
        requireLogin: Type.Boolean(),
        group: Type.String(),
        mission: Type.String()
    })
}))

const Plugins = Type.Object({});
const Cluster = Type.Object({});
const Vbm = Type.Object({});

export default Type.Object({
    Configuration: Type.Object({
        _attributes: Type.Object({
            xmlns: Type.Optional(Type.String()),
            forceLowConcurrency: Type.Optional(Type.Boolean({
                default: true
            }))
        }),
        network: Network,
        auth: Auth,
        submission: Submission,
        subscription: Subscription,
        repository: Repository,
        repeater: Repeater,
        filter: Filter,
        buffer: Buff,
        dissemination: Dissemination,
        certificateSigning: Type.Optional(CertificateSigning),
        logging: Type.Optional(Logging),
        security: Security,
        ferry: Type.Optional(Ferry),
        async: Type.Optional(Async),
        federation: Type.Optional(Federation),
        geocache: Type.Optional(Geocache),
        citrap: Type.Optional(Citrap),
        xmpp: Type.Optional(Xmpp),
        plugins: Type.Optional(Plugins),
        cluster: Type.Optional(Cluster),
        docs: Type.Optional(Docs),
        email: Type.Optional(Email),
        locate: Type.Optional(Locate),
        vbm: Type.Optional(Vbm),
        profile: Type.Optional(Profile)
    })
});
