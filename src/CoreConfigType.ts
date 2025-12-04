import { Type } from '@sinclair/typebox';

const NetworkConnector = Type.Object({
    _attributes: Type.Object({
        port: Type.Integer(),
        _name: Type.Optional(Type.String()),
        clientAuth: Type.Optional(Type.String({ default: "true" })),
        keystore: Type.Optional(Type.String()),
        keystoreFile: Type.Optional(Type.String()),
        keystorePass: Type.Optional(Type.String()),
        useFederationTruststore: Type.Optional(Type.Boolean({ default: false })),
        enableAdminUI: Type.Optional(Type.Boolean({ default: true })),
        enableWebtak: Type.Optional(Type.Boolean({ default: true })),
        enableNonAdminUI: Type.Optional(Type.Boolean({ default: true })),
        tls: Type.Optional(Type.Boolean({ default: true })),
        allowBasicAuth: Type.Optional(Type.Boolean({ default: false })),
        crlFile: Type.Optional(Type.String()),
        truststore: Type.Optional(Type.String()),
        truststoreFile: Type.Optional(Type.String()),
        truststorePass: Type.Optional(Type.String()),
        allowOrigins: Type.Optional(Type.String({ default: "" })),
        allowMethods: Type.Optional(Type.String({ default: "POST, PUT, GET, HEAD, OPTIONS, DELETE" })),
        allowHeaders: Type.Optional(Type.String({ default: "Accept, Access-Control-Allow-Headers, Authorization, Content-Type, Cookie, Origin, missionauthorization, X-Requested-With" })),
        allowCredentials: Type.Optional(Type.Boolean({ default: false })),
    }),
    header: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            key: Type.String(),
            value: Type.String()
        })
    })))
})

const NetworkInput = Type.Object({
    _attributes: Type.Object({
        auth: Type.Optional(Type.String({ default: "x509" })),
        _name: Type.String(),
        protocol: Type.String(),
        port: Type.Integer(),
        coreVersion: Type.Optional(Type.Integer({ default: 2 })),
        authRequired: Type.Optional(Type.Boolean({ default: false })),
        group: Type.Optional(Type.String()),
        iface: Type.Optional(Type.String()),
        archive: Type.Optional(Type.Boolean({ default: true })),
        anongroup: Type.Optional(Type.Boolean()),
        archiveOnly: Type.Optional(Type.Boolean({ default: false })),
        federateOnly: Type.Optional(Type.Boolean({ default: false })),
        syncCacheRetentionSeconds: Type.Optional(Type.Integer({ default: 3600 })),
        maxMessageReadSizeBytes: Type.Optional(Type.Integer({ default: 2048 })),
        coreVersion2TlsVersions: Type.Optional(Type.String({ default: "TLSv1.2,TLSv1.3" })),
        federated: Type.Optional(Type.Boolean({ default: true })),
        binaryPayloadWebsocketOnly: Type.Optional(Type.Boolean({ default: false })),
        quicConnectionTimeoutSeconds: Type.Optional(Type.Integer({ default: 90 })),
        takServerHost: Type.Optional(Type.String()),
    }),
    filtergroup: Type.Optional(Type.Array(Type.String())),
    filter: Type.Optional(Type.Any())
})

const NetworkDatafeed = Type.Object({
    _attributes: Type.Object({
        auth: Type.Optional(Type.String({ default: "x509" })),
        _name: Type.String(),
        protocol: Type.String(),
        port: Type.Integer(),
        coreVersion: Type.Optional(Type.Integer({ default: 2 })),
        authRequired: Type.Optional(Type.Boolean({ default: false })),
        group: Type.Optional(Type.String()),
        iface: Type.Optional(Type.String()),
        archive: Type.Optional(Type.Boolean({ default: true })),
        anongroup: Type.Optional(Type.Boolean()),
        archiveOnly: Type.Optional(Type.Boolean({ default: false })),
        federateOnly: Type.Optional(Type.Boolean({ default: false })),
        syncCacheRetentionSeconds: Type.Optional(Type.Integer({ default: 3600 })),
        maxMessageReadSizeBytes: Type.Optional(Type.Integer({ default: 2048 })),
        coreVersion2TlsVersions: Type.Optional(Type.String({ default: "TLSv1.2,TLSv1.3" })),
        federated: Type.Optional(Type.Boolean({ default: true })),
        binaryPayloadWebsocketOnly: Type.Optional(Type.Boolean({ default: false })),
        quicConnectionTimeoutSeconds: Type.Optional(Type.Integer({ default: 90 })),
        takServerHost: Type.Optional(Type.String()),
    }),
    uuid: Type.String(),
    type: Type.String(),
    tag: Type.Optional(Type.Array(Type.String())),
    sync: Type.Boolean()
})

const Network = Type.Object({
    _attributes: Type.Optional(Type.Object({
        multicastTTL: Type.Optional(Type.Integer({ default: 1 })),
        serverId: Type.Optional(Type.String({ default: "" })),
        version: Type.Optional(Type.String({ default: "" })),
        cloudwatchEnable: Type.Optional(Type.Boolean({ default: false })),
        cloudwatchName: Type.Optional(Type.String({ default: "" })),
        enterpriseSyncSizeLimitMB: Type.Optional(Type.Integer({ default: 400 })),
        enterpriseSyncSizeUploadTimeoutMillis: Type.Optional(Type.Integer({ default: 600000 })),
        enterpriseSyncSizeDownloadTimeoutMillis: Type.Optional(Type.Integer({ default: 600000 })),
        missionPackageAutoExtractSizeLimitMB: Type.Optional(Type.Integer({ default: 10 })),
        httpSessionTimeoutMinutes: Type.Optional(Type.Integer({ default: 130 })),
        extWebContentDir: Type.Optional(Type.String({ default: "webcontent" })),
        takServerHost: Type.Optional(Type.String()),
        useLinuxEpoll: Type.Optional(Type.Boolean({ default: true })),
        allowAllOrigins: Type.Optional(Type.Boolean({ default: false })),
        enableHSTS: Type.Optional(Type.Boolean({ default: true })),
        esyncEnableCache: Type.Optional(Type.Integer({ default: 0 })),
        esyncEnableCotFilter: Type.Optional(Type.Boolean({ default: false })),
        esyncCotFilter: Type.Optional(Type.String()),
        webCiphers: Type.Optional(Type.String({ default: "" })),
        tomcatPoolIdleToMax: Type.Optional(Type.Boolean({ default: true })),
        tomcatMaxPool: Type.Optional(Type.Integer({ default: -1 })),
        tomcatPoolMultiplier: Type.Optional(Type.Integer({ default: 2 })),
        apiAsyncExecutorMultiplier: Type.Optional(Type.Integer({ default: 2 })),
        apiAsyncExecutorQueueSize: Type.Optional(Type.Integer({ default: 64 })),
        cloudwatchNamespace: Type.Optional(Type.String({ default: "takserver" })),
        cloudwatchMetricsBatchSize: Type.Optional(Type.Integer({ default: 20 })),
        missionCopTool: Type.Optional(Type.String({ default: "vbm" })),
        reportTimeoutSeconds: Type.Optional(Type.Integer()),
        reportTimeoutCheckIntervalSeconds: Type.Optional(Type.Integer({ default: 60 })),
        alwaysArchiveMissionCot: Type.Optional(Type.Boolean({ default: false })),
        MissionCreateGroupsRegex: Type.Optional(Type.String()),
        MissionDeleteRequiresOwner: Type.Optional(Type.Boolean({ default: false })),
        MissionUseGroupsForContents: Type.Optional(Type.Boolean({ default: false })),
        MissionAllowGroupChange: Type.Optional(Type.Boolean({ default: false })),
        MissionStrictUidMissionMembership: Type.Optional(Type.Boolean({ default: true })),
        MissionBrokerUidAddsFromApi: Type.Optional(Type.Boolean({ default: true })),
    })),
    input: Type.Optional(Type.Union([
        NetworkInput,
        Type.Array(NetworkInput)
    ])),
    datafeed: Type.Optional(Type.Union([
        NetworkDatafeed,
        Type.Array(NetworkDatafeed)
    ])),
    connector: Type.Optional(Type.Union([NetworkConnector, Type.Array(NetworkConnector)])),
    announce: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: false })),
            uid: Type.Optional(Type.String()),
            group: Type.Optional(Type.String()),
            port: Type.Optional(Type.Integer()),
            interval: Type.Optional(Type.Integer()),
            ip: Type.Optional(Type.String()),
            svctype: Type.Optional(Type.String({ default: "a-f-A-M-F-F" })),
        }))
    }))
})

const Auth = Type.Object({
    _attributes: Type.Optional(Type.Object({
        default: Type.Optional(Type.String({ default: "file" })),
        DNUsernameExtractorRegex: Type.Optional(Type.String({ default: "CN=(.*?)(?:,|$)" })),
        x509groups: Type.Optional(Type.Boolean({ default: true })),
        x509groupsDefaultRDN: Type.Optional(Type.Boolean({ default: false })),
        x509addAnonymous: Type.Optional(Type.Boolean({ default: false })),
        x509useGroupCache: Type.Optional(Type.Boolean({ default: false })),
        x509useGroupCacheDefaultActive: Type.Optional(Type.Boolean({ default: false })),
        x509useGroupCacheDefaultUpdatesActive: Type.Optional(Type.Boolean({ default: false })),
        x509useGroupCacheRequiresActiveGroup: Type.Optional(Type.Boolean({ default: false })),
        x509useGroupCacheRequiresExtKeyUsage: Type.Optional(Type.Boolean({ default: true })),
        x509checkRevocation: Type.Optional(Type.Boolean({ default: false })),
        x509tokenAuth: Type.Optional(Type.Boolean({ default: false })),
        x509assignAdminAllGroups: Type.Optional(Type.Boolean({ default: true })),
    })),
    ldap: Type.Optional(Type.Object({
        _attributes: Type.Object({
            url: Type.String(),
            userstring: Type.String(),
            updateinterval: Type.Optional(Type.Integer()),
            groupprefix: Type.Optional(Type.String({ default: '' })),
            groupNameExtractorRegex: Type.Optional(Type.String({ default: "CN=(.*?)(?:,|$)" })),
            style: Type.Optional(Type.String({ default: 'DS' })),
            ldapSecurityType: Type.Optional(Type.String({ default: 'simple' })),
            serviceAccountDN: Type.Optional(Type.String()),
            serviceAccountCredential: Type.Optional(Type.String()),
            groupObjectClass: Type.Optional(Type.String({ default: 'group' })),
            userObjectClass: Type.Optional(Type.String({ default: 'user' })),
            groupBaseRDN: Type.Optional(Type.String()),
            userBaseRDN: Type.Optional(Type.String()),
            x509groups: Type.Optional(Type.Boolean({ default: true })),
            x509addAnonymous: Type.Optional(Type.Boolean({ default: false })),
            matchGroupInChain: Type.Optional(Type.Boolean({ default: false })),
            nestedGroupLookup: Type.Optional(Type.Boolean({ default: false })),
            postMissionEventsAsPublic: Type.Optional(Type.Boolean({ default: false })),
            ldapsTruststore: Type.Optional(Type.String()),
            ldapsTruststoreFile: Type.Optional(Type.String()),
            ldapsTruststorePass: Type.Optional(Type.String()),
            readOnlyGroup: Type.Optional(Type.String()),
            readGroupSuffix: Type.Optional(Type.String({ default: '_READ' })),
            writeGroupSuffix: Type.Optional(Type.String({ default: '_WRITE' })),
            loginWithEmail: Type.Optional(Type.Boolean({ default: false })),
            callsignAttribute: Type.Optional(Type.String()),
            colorAttribute: Type.Optional(Type.String()),
            roleAttribute: Type.Optional(Type.String()),
            enableConnectionPool: Type.Optional(Type.Boolean({ default: false })),
            connectionPoolTimeout: Type.Optional(Type.String({ default: "30000" })),
            dnAttributeName: Type.Optional(Type.String({ default: 'distinguishedName' })),
            nameAttr: Type.Optional(Type.String({ default: 'cn' })),
            nameAttrAD: Type.Optional(Type.String({ default: 'sAMAccountName' })),
            adminGroup: Type.Optional(Type.String()),
        }),
        filtergroup: Type.Optional(Type.Array(Type.String()))
    })),
    File: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            location: Type.Optional(Type.String({ default: "UserAuthenticationFile.xml" }))
        }))
    })),
    oauth: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            oauthAddAnonymous: Type.Optional(Type.Boolean({ default: false })),
            oauthUseGroupCache: Type.Optional(Type.Boolean({ default: false })),
            loginWithEmail: Type.Optional(Type.Boolean({ default: false })),
            useTakServerLoginPage: Type.Optional(Type.Boolean({ default: false })),
            readOnlyGroup: Type.Optional(Type.String()),
            readGroupSuffix: Type.Optional(Type.String({ default: "_READ" })),
            writeGroupSuffix: Type.Optional(Type.String({ default: "_WRITE" })),
            groupsClaim: Type.Optional(Type.String({ default: "groups" })),
            usernameClaim: Type.Optional(Type.String()),
            scopeClaim: Type.Optional(Type.String({ default: "scope" })),
            webtakScope: Type.Optional(Type.String()),
            groupprefix: Type.Optional(Type.String({ default: "" })),
            allowUriQueryParameter: Type.Optional(Type.Boolean({ default: false })),
            allowAccessTokenRetrieval: Type.Optional(Type.Boolean({ default: false })),
        })),
        client: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                clientId: Type.String(),
                secret: Type.Optional(Type.String()),
                redirectUri: Type.Optional(Type.String()),
                resourceIds: Type.Optional(Type.String()),
                scope: Type.Optional(Type.String()),
                authorizedGrantTypes: Type.Optional(Type.String()),
                authorities: Type.Optional(Type.String({ default: "ROLE_ANONYMOUS" })),
                autoapprove: Type.Optional(Type.String()),
                refreshTokenValidity: Type.Optional(Type.Integer()),
            })
        }))),
        authServer: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                name: Type.String(),
                issuer: Type.String(),
                clientId: Type.String(),
                secret: Type.String(),
                redirectUri: Type.String(),
                scope: Type.Optional(Type.String()),
                authEndpoint: Type.String(),
                tokenEndpoint: Type.String(),
                accessTokenName: Type.Optional(Type.String({ default: "access_token" })),
                refreshTokenName: Type.Optional(Type.String({ default: "refresh_token" })),
                trustAllCerts: Type.Optional(Type.Boolean({ default: false })),
            }),
            key: Type.Optional(Type.Array(Type.String()))
        }))),
        openIdDiscoveryConfiguraiton: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                name: Type.String(),
                clientId: Type.String(),
                secret: Type.String(),
                redirectUri: Type.String(),
                configurationUri: Type.String(),
                accessTokenName: Type.Optional(Type.String({ default: "access_token" })),
                refreshTokenName: Type.Optional(Type.String({ default: "refresh_token" })),
                trustAllCerts: Type.Optional(Type.Boolean({ default: false })),
            })
        })))
    }))
})

const Submission = Type.Object({
    _attributes: Type.Optional(Type.Object({
        ignoreStaleMessages: Type.Optional(Type.Boolean()),
        validateXml: Type.Optional(Type.Boolean({ default: false })),
        dropMesssagesIfAnyServiceIsFull: Type.Optional(Type.Boolean({ default: false })),
    }))
})

const Subscription = Type.Object({
    _attributes: Type.Optional(Type.Object({
        reloadPersistent: Type.Optional(Type.Boolean({ default: false }))
    })),
    static: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            _name: Type.String(),
            protocol: Type.String(),
            address: Type.String(),
            port: Type.Integer(),
            xpath: Type.Optional(Type.String({ default: "*" })),
            federated: Type.Optional(Type.Boolean({ default: false })),
            iface: Type.Optional(Type.String()),
        }),
        filtergroup: Type.Optional(Type.Array(Type.String())),
        filter: Type.Optional(Type.Any())
    })))
})

const Repository = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enable: Type.Optional(Type.Boolean({ default: true })),
        numDbConnections: Type.Optional(Type.Integer({ default: 200 })),
        connectionPoolAutoSize: Type.Optional(Type.Boolean({ default: true })),
        primaryKeyBatchSize: Type.Optional(Type.Integer({ default: 500 })),
        insertionBatchSize: Type.Optional(Type.Integer({ default: 500 })),
        archive: Type.Optional(Type.Boolean({ default: false })),
        iconsetDir: Type.Optional(Type.String({ default: "iconsets" })),
        enableCallsignAudit: Type.Optional(Type.Boolean({ default: true })),
        contactCacheMaxClearRateSeconds: Type.Optional(Type.Integer({ default: 1 })),
        dbTimeoutMs: Type.Optional(Type.Integer({ default: 60000 })),
        dbConnectionMaxLifetimeMs: Type.Optional(Type.Integer({ default: 600000 })),
        dbConnectionMaxIdleMs: Type.Optional(Type.Integer({ default: 10000 })),
        poolScaleFactor: Type.Optional(Type.Integer({ default: 200 })),
    })),
    connection: Type.Object({
        _attributes: Type.Optional(Type.Object({
            url: Type.Optional(Type.String({ default: "jdbc:postgresql://127.0.0.1:5432/cot" })),
            username: Type.Optional(Type.String({ default: "martiuser" })),
            password: Type.Optional(Type.String({ default: "" })),
            sslEnabled: Type.Optional(Type.Boolean({ default: false })),
            sslMode: Type.Optional(Type.String({ default: "verify-ca" })),
            sslCert: Type.Optional(Type.String({ default: "" })),
            sslKey: Type.Optional(Type.String({ default: "" })),
            sslRootCert: Type.Optional(Type.String({ default: "" })),
            queryBufferMaxMemoryPercentage: Type.Optional(Type.Integer({ default: 40 })),
        }))
    })
})

const Repeater = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enable: Type.Optional(Type.Boolean({ default: false })),
        periodMillis: Type.Optional(Type.Integer({ default: 10000 })),
        staleDelayMillis: Type.Optional(Type.Integer({ default: 15000 })),
        maxAllowedRepeatables: Type.Optional(Type.Integer({ default: 2147483647 })),
    })),
    repeatableType: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            'initiate-test': Type.Optional(Type.String()),
            'cancel-test': Type.Optional(Type.String()),
            _name: Type.Optional(Type.String())
        })
    })))
})

const Filter = Type.Object({
    thumbnail: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: false })),
            pixels: Type.Optional(Type.Integer({ default: 10 })),
        }))
    })),
    urladd: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            thumburl: Type.Optional(Type.Boolean({ default: false })),
            fullurl: Type.Optional(Type.Boolean({ default: true })),
            script: Type.Optional(Type.String({ default: "/Marti/loadImage.jsp" })),
            vidscript: Type.Optional(Type.String({ default: "/Marti/videoclip.jsp" })),
            host: Type.Optional(Type.String()),
            overwriteurl: Type.Optional(Type.Boolean({ default: false })),
        }))
    })),
    flowtag: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: true })),
            text: Type.Optional(Type.String({ default: "" })),
        }))
    })),
    streamingbroker: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: false })),
        }))
    })),
    dropfilter: Type.Optional(Type.Object({
        typefilter: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Optional(Type.Object({
                type: Type.Optional(Type.String()),
                detail: Type.Optional(Type.String()),
                threshold: Type.Optional(Type.Integer({ default: 30 })),
            }))
        })))
    })),
    injectionfilter: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: true })),
        })),
        uidInject: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                uid: Type.Optional(Type.String()),
                toInject: Type.Optional(Type.String()),
            })
        })))
    })),
    scrubber: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: true })),
            action: Type.Optional(Type.String({ default: "drop" })),
        }))
    })),
    geospatialFilter: Type.Optional(Type.Object({
        _attributes: Type.Optional(Type.Object({
            minAltitude: Type.Optional(Type.Number()),
            maxAltitude: Type.Optional(Type.Number()),
        })),
        boundingBox: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                minLongitude: Type.Optional(Type.Number()),
                minLatitude: Type.Optional(Type.Number()),
                maxLongitude: Type.Optional(Type.Number()),
                maxLatitude: Type.Optional(Type.Number()),
                minAltitude: Type.Optional(Type.Number()),
                maxAltitude: Type.Optional(Type.Number()),
            })
        })))
    })),
    qos: Type.Optional(Type.Object({
        deliveryRateLimiter: Type.Optional(Type.Object({
            _attributes: Type.Optional(Type.Object({
                enabled: Type.Optional(Type.Boolean({ default: true })),
            })),
            rateLimitRule: Type.Optional(Type.Array(Type.Object({
                _attributes: Type.Object({
                    clientThresholdCount: Type.Optional(Type.Integer()),
                    reportingRateLimitSeconds: Type.Optional(Type.Integer()),
                })
            })))
        })),
        readRateLimiter: Type.Optional(Type.Object({
            _attributes: Type.Optional(Type.Object({
                enabled: Type.Optional(Type.Boolean({ default: false })),
            })),
            rateLimitRule: Type.Optional(Type.Array(Type.Object({
                _attributes: Type.Object({
                    clientThresholdCount: Type.Optional(Type.Integer()),
                    reportingRateLimitSeconds: Type.Optional(Type.Integer()),
                })
            })))
        })),
        dosRateLimiter: Type.Optional(Type.Object({
            _attributes: Type.Optional(Type.Object({
                enabled: Type.Optional(Type.Boolean({ default: false })),
                intervalSeconds: Type.Optional(Type.Integer({ default: 60 })),
            })),
            dosLimitRule: Type.Optional(Type.Array(Type.Object({
                _attributes: Type.Object({
                    clientThresholdCount: Type.Optional(Type.Integer()),
                    messageLimitPerInterval: Type.Optional(Type.Integer()),
                })
            })))
        }))
    })),
    "contact-api": Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Optional(Type.Object({
            groupName: Type.Optional(Type.String({ default: "" })),
            writeOnly: Type.Optional(Type.Boolean({ default: true })),
        }))
    })))
});

const Buff = Type.Object({
    queue: Type.Object({
        _attributes: Type.Optional(Type.Object({
            pubSubCapacity: Type.Optional(Type.Integer({ default: 512 })),
            outboundCapacity: Type.Optional(Type.Integer({ default: 4 })),
            inboundCapacity: Type.Optional(Type.Integer({ default: 4096 })),
            codecWrapperCapacity: Type.Optional(Type.Integer({ default: 2048 })),
            tcpWriteQueueCapacity: Type.Optional(Type.Integer({ default: 32768 })),
            disconnectOnFull: Type.Optional(Type.Boolean({ default: false })),
            maxWriteQueueSize: Type.Optional(Type.Integer({ default: 2048 })),
            defaultExecQueueSize: Type.Optional(Type.Integer({ default: 1024 })),
            defaultMaxPoolSize: Type.Optional(Type.Integer({ default: 8 })),
            defaultMaxPoolFactor: Type.Optional(Type.Integer({ default: 2 })),
            defaultCoreMaxPoolFactor: Type.Optional(Type.Integer({ default: 2 })),
            messageWriteQueueSize: Type.Optional(Type.Integer({ default: 32 })),
            messageWriteExecutorQueueSize: Type.Optional(Type.Integer({ default: 16384 })),
            codecViewPendingCapacity: Type.Optional(Type.Integer({ default: 2048 })),
            queueSizeInitial: Type.Optional(Type.Integer({ default: 1 })),
            queueSizeIncrement: Type.Optional(Type.Integer({ default: 2 })),
            queueSizeMaxCapacity: Type.Optional(Type.Integer({ default: 2048 })),
            coreExecutorCapacity: Type.Optional(Type.Integer({ default: 32768 })),
            throwOnAssertionFail: Type.Optional(Type.Boolean({ default: false })),
            disconnectOnPendingExceeded: Type.Optional(Type.Boolean({ default: true })),
            flushInterval: Type.Optional(Type.Integer({ default: 1000 })),
            websocketSendBufferSizeLimit: Type.Optional(Type.Integer({ default: 65536 })),
            websocketMaxBinaryMessageBufferSize: Type.Optional(Type.Integer({ default: 65536 })),
            websocketMaxSessionIdleTimeout: Type.Optional(Type.Integer({ default: -1 })),
            websocketSendTimeoutMs: Type.Optional(Type.Integer({ default: 5000 })),
            missionUidLimit: Type.Optional(Type.Integer({ default: 8192 })),
            missionContentLimit: Type.Optional(Type.Integer({ default: 4096 })),
            missionConcurrentDownloadLimit: Type.Optional(Type.Integer()),
            nearCacheMaxSize: Type.Optional(Type.Integer({ default: 0 })),
            cotCacheMaxSize: Type.Optional(Type.Integer({ default: 0 })),
            cotCacheBatchSize: Type.Optional(Type.Integer({ default: -1 })),
            cotCacheMaxMemorySize: Type.Optional(Type.Integer({ default: -1 })),
            springCacheMaxSize: Type.Optional(Type.Integer({ default: -1 })),
            springCacheBatchSize: Type.Optional(Type.Integer({ default: -1 })),
            springCacheMaxMemorySize: Type.Optional(Type.Integer({ default: -1 })),
            springCacheSizeScalingFactor: Type.Optional(Type.Integer({ default: 8 })),
            onHeapEnabled: Type.Optional(Type.Boolean({ default: false })),
            cacheLastTouchedExpiryMinutes: Type.Optional(Type.Integer({ default: 10 })),
            enableCacheGroup: Type.Optional(Type.Boolean({ default: true })),
            enableCacheGroupPerName: Type.Optional(Type.Boolean({ default: false })),
            enableGetAllMissionsCacheWarmer: Type.Optional(Type.Boolean({ default: true })),
            enableIndividualHydratedMissionsCacheWarmer: Type.Optional(Type.Boolean({ default: false })),
            cacheCotInRepository: Type.Optional(Type.Boolean({ default: false })),
            messageTimestampCacheSizeItems: Type.Optional(Type.Integer({ default: -1 })),
            enableStoreForwardChat: Type.Optional(Type.Boolean({ default: false })),
            storeForwardQueryBufferMs: Type.Optional(Type.Integer({ default: 1000 })),
            storeForwardSendBufferMs: Type.Optional(Type.Integer({ default: 200 })),
            enableClientEndpointCache: Type.Optional(Type.Boolean({ default: true })),
            contactCacheUpdateRateLimitSeconds: Type.Optional(Type.Integer({ default: 5 })),
            contactCacheRecencyLimitSeconds: Type.Optional(Type.Integer({ default: 86400 })),
            pluginDatafeedCacheSeconds: Type.Optional(Type.Integer({ default: 300 })),
            caffeineFileCacheSeconds: Type.Optional(Type.Integer({ default: 120 })),
            oAuthConfigurationsCacheSeconds: Type.Optional(Type.Integer({ default: 86400 })),
            oAuthPublicKeyCacheSeconds: Type.Optional(Type.Integer({ default: 43200 })),
            groupDescriptionCacheSeconds: Type.Optional(Type.Integer({ default: 300 })),
            missionCacheLockTimeoutMilliseconds: Type.Optional(Type.Integer({ default: 10000 })),
        })),
        priority: Type.Optional(Type.Object({
            _attributes: Type.Optional(Type.Object({
                levels: Type.Optional(Type.Integer({ default: 3 })),
            }))
        }))
    }),
    latestSA: Type.Object({
        _attributes: Type.Optional(Type.Object({
            enable: Type.Optional(Type.Boolean({ default: false })),
            validateClientUid: Type.Optional(Type.Boolean({ default: false })),
        }))
    })
});

const Dissemination = Type.Object({
    _attributes: Type.Optional(Type.Object({
        smartRetry: Type.Optional(Type.Boolean({ default: false })),
        boundedSubscriptionWrite: Type.Optional(Type.Boolean({ default: false })),
        enabled: Type.Optional(Type.Boolean({ default: true })),
    }))
})

const CertificateSigning = Type.Object({
    _attributes: Type.Object({
        CA: Type.String(),
    }),
    certificateConfig: Type.Object({
        nameEntries: Type.Optional(Type.Object({
            nameEntry: Type.Optional(Type.Array(Type.Object({
                _attributes: Type.Optional(Type.Object({
                    name: Type.Optional(Type.String()),
                    value: Type.Optional(Type.String())
                }))
            })))
        }))
    }),
    TAKServerCAConfig: Type.Optional(Type.Object({
        _attributes: Type.Object({
            keystore: Type.String(),
            keystoreFile: Type.String(),
            keystorePass: Type.String(),
            validityDays: Type.Optional(Type.String({ default: "365" })),
            validityHours: Type.Optional(Type.Integer()),
            validityNotBeforeOffsetMinutes: Type.Optional(Type.Integer({ default: 720 })),
            signatureAlg: Type.String(),
            CAkey: Type.Optional(Type.String()),
            CAcertificate: Type.Optional(Type.String()),
            useTokenExpiration: Type.Optional(Type.Boolean({ default: false })),
        })
    })),
    MicrosoftCAConfig: Type.Optional(Type.Object({
        _attributes: Type.Object({
            username: Type.String(),
            password: Type.String(),
            truststore: Type.String(),
            truststorePass: Type.String(),
            svcUrl: Type.String(),
            templateName: Type.String(),
            trustAllHosts: Type.Optional(Type.Boolean({ default: false })),
        })
    }))
})

const Logging = Type.Object({
    _attributes: Type.Optional(Type.Object({
        jsonFormatEnabled: Type.Optional(Type.Boolean({ default: false })),
        auditLoggingEnabled: Type.Optional(Type.Boolean({ default: false })),
        prettyLoggingEnabled: Type.Optional(Type.Boolean({ default: false })),
        lineSeparatorIncluded: Type.Optional(Type.Boolean({ default: true })),
        doubleSpaced: Type.Optional(Type.Boolean({ default: false })),
        httpAccessEnabled: Type.Optional(Type.Boolean({ default: false })),
    }))
});

const Security = Type.Object({
    tls: Type.Optional(Type.Object({
        _attributes: Type.Object({
            keystore: Type.String(),
            keystoreFile: Type.String(),
            keystorePass: Type.String(),
            truststore: Type.String(),
            truststoreFile: Type.String(),
            truststorePass: Type.String(),
            context: Type.Optional(Type.String({ default: "TLSv1.2" })),
            ciphers: Type.Optional(Type.String()),
            keymanager: Type.String(),
            enableOCSP: Type.Optional(Type.Boolean({ default: false })),
            responderUrl: Type.Optional(Type.String()),
        }),
        crl: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                _name: Type.String(),
                crlFile: Type.String(),
            })
        })))
    })),
    missionTls: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            keystore: Type.String(),
            keystoreFile: Type.String(),
            keystorePass: Type.String()
        })
    })))
})

const Ferry = Type.Object({
    _attributes: Type.Object({
        enable: Type.Optional(Type.Boolean({ default: false })),
        stale: Type.Optional(Type.Integer({ default: 60 })),
        webserver: Type.String(),
    }),
    endpoint: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            _name: Type.String(),
            callsign: Type.Optional(Type.String()),
        })
    })))
});

const Async = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enable: Type.Optional(Type.Boolean({ default: true })),
    }))
});

const Federation = Type.Object({
    _attributes: Type.Optional(Type.Object({
        allowDuplicate: Type.Optional(Type.Boolean({ default: false })),
        allowFederatedDelete: Type.Optional(Type.Boolean({ default: false })),
        allowMissionFederation: Type.Optional(Type.Boolean({ default: true })),
        allowDataFeedFederation: Type.Optional(Type.Boolean({ default: true })),
        enableMissionFederationDisruptionTolerance: Type.Optional(Type.Boolean({ default: true })),
        missionFederationDisruptionToleranceRecencySeconds: Type.Optional(Type.Integer({ default: 43200 })),
        federateOnlyPublicMissions: Type.Optional(Type.Boolean({ default: false })),
        enableFederation: Type.Optional(Type.Boolean({ default: false })),
        enableDataPackageAndMissionFileFilter: Type.Optional(Type.Boolean({ default: false })),
    })),
    "federation-server": Type.Optional(Type.Object({
        _attributes: Type.Object({
            port: Type.Optional(Type.Integer({ default: 9000 })),
            coreVersion: Type.Optional(Type.Integer({ default: 2 })),
            v1enabled: Type.Optional(Type.Boolean({ default: true })),
            v2port: Type.Optional(Type.Integer({ default: 9001 })),
            v2enabled: Type.Optional(Type.Boolean({ default: true })),
            webBaseUrl: Type.Optional(Type.String({ default: "" })),
            httpsPort: Type.Optional(Type.Integer({ default: 8444 })),
            healthCheckIntervalSeconds: Type.Optional(Type.Integer({ default: 3 })),
            initializationDelaySeconds: Type.Optional(Type.Integer({ default: 30 })),
            maxMessageSizeBytes: Type.Optional(Type.Integer({ default: 268435456 })),
        }),
        tls: Type.Object({
            _attributes: Type.Object({
                keystore: Type.String(),
                keystoreFile: Type.String(),
                keystorePass: Type.String(),
                truststore: Type.String(),
                truststoreFile: Type.String(),
                truststorePass: Type.String(),
                context: Type.Optional(Type.String({ default: "TLSv1.2" })),
                ciphers: Type.Optional(Type.String()),
                keymanager: Type.String(),
                enableOCSP: Type.Optional(Type.Boolean({ default: false })),
                responderUrl: Type.Optional(Type.String()),
            })
        }),
        "federation-port": Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                port: Type.Optional(Type.Integer()),
                tlsVersion: Type.Optional(Type.String({ default: "TLSv1.2" })),
            })
        }))),
        v1Tls: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                tlsVersion: Type.Optional(Type.String({ default: "TLSv1.2" })),
            })
        }))),
        "federation-token-authentication": Type.Object({
            _attributes: Type.Object({
                enabled: Type.Optional(Type.Boolean({ default: false })),
                port: Type.Optional(Type.Integer({ default: 9002 })),
            })
        })
    })),
    "federation-outgoing": Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            displayName: Type.Optional(Type.String()),
            address: Type.Optional(Type.String()),
            port: Type.Optional(Type.Integer()),
            enabled: Type.Optional(Type.Boolean({ default: true })),
            protocolVersion: Type.Optional(Type.Integer({ default: 1 })),
            reconnectInterval: Type.Optional(Type.Integer({ default: 30 })),
            filter: Type.Optional(Type.String()),
            maxFrameSize: Type.Optional(Type.Integer({ default: 268435456 })),
            fallback: Type.Optional(Type.String()),
            maxRetries: Type.Optional(Type.Integer({ default: 0 })),
            unlimitedRetries: Type.Optional(Type.Boolean({ default: true })),
            connectionToken: Type.Optional(Type.String({ default: "" })),
            useToken: Type.Optional(Type.Boolean({ default: false })),
            tokenType: Type.Optional(Type.String({ default: "" })),
        })
    }))),
    "mission-disruption-tolerance": Type.Optional(Type.Object({
        mission: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                name: Type.Optional(Type.String()),
                recencySeconds: Type.Optional(Type.Integer({ default: 43200 })),
            })
        })))
    })),
    federate: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            id: Type.String(),
            name: Type.String(),
            notes: Type.Optional(Type.String()),
            shareAlerts: Type.Optional(Type.Boolean({ default: true })),
            archive: Type.Optional(Type.Boolean({ default: true })),
            federatedGroupMapping: Type.Optional(Type.Boolean({ default: false })),
            automaticGroupMapping: Type.Optional(Type.Boolean({ default: false })),
            maxHops: Type.Optional(Type.Integer({ default: -1 })),
            useGroupHopLimiting: Type.Optional(Type.Boolean({ default: false })),
            fallbackWhenNoGroupMappings: Type.Optional(Type.Boolean({ default: false })),
            tokenFederate: Type.Optional(Type.Boolean({ default: false })),
            tokenExpiration: Type.Optional(Type.Integer()),
        }),
        inboundGroupMapping: Type.Optional(Type.Array(Type.String())),
        inboundGroup: Type.Optional(Type.Array(Type.String())),
        outboundGroup: Type.Optional(Type.Array(Type.String())),
        missionFederateDefault: Type.Optional(Type.Boolean({ default: true })),
        mission: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                name: Type.String(),
                enabled: Type.Boolean(),
            })
        }))),
        outboundGroupHopLimit: Type.Optional(Type.Array(Type.Object({
            _attributes: Type.Object({
                groupName: Type.String(),
                hopLimit: Type.Optional(Type.Integer({ default: -1 })),
            })
        })))
    }))),
    fileFilter: Type.Optional(Type.Object({
        fileExtension: Type.Optional(Type.Array(Type.String()))
    })),
    federateCA: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            fingerprint: Type.String(),
            maxHops: Type.Optional(Type.Integer({ default: -1 })),
            allowTokenAuth: Type.Optional(Type.Boolean({ default: false })),
            tokenAuthDuration: Type.Optional(Type.Integer({ default: -1 })),
        }),
        inboundGroup: Type.Optional(Type.Array(Type.String())),
        outboundGroup: Type.Optional(Type.Array(Type.String())),
    })))
});

const Geocache = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enable: Type.Optional(Type.Boolean({ default: false })),
        connectId: Type.Optional(Type.String()),
        maxTilesPerGoal: Type.Optional(Type.Integer({ default: 1000 })),
        maxSizeOfCacheInMb: Type.Optional(Type.Integer({ default: 1000 })),
        cacheDir: Type.Optional(Type.String({ default: "/tmp/geocache" })),
        numThreads: Type.Optional(Type.Integer({ default: 10 })),
    }))
});

const Citrap = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enableNotifications: Type.Optional(Type.Boolean({ default: false })),
        notificationCot: Type.Optional(Type.String({ default: "a-h-G-U-C-R" })),
        nonsubscriberCotFilter: Type.Optional(Type.String({ default: "a-f%" })),
        searchRadius: Type.Optional(Type.Integer({ default: 100000 })),
        searchSecago: Type.Optional(Type.Integer({ default: 300 })),
    }))
});

const Xmpp = Type.Object({
    _attributes: Type.Optional(Type.Object({
        xmppHost: Type.Optional(Type.String({ default: "127.0.0.1" })),
        xmppPort: Type.Optional(Type.Integer({ default: 5222 })),
        takServerHost: Type.Optional(Type.String({ default: "127.0.0.1" })),
        takServerPort: Type.Optional(Type.Integer({ default: 8443 })),
        xmppSharedSecret: Type.Optional(Type.String({ default: "" })),
        xmppComponentRetryCount: Type.Optional(Type.Integer({ default: 5 })),
        xmppComponentRetryDelay: Type.Optional(Type.Integer({ default: 5 })),
    }))
});

const Docs = Type.Object({
    _attributes: Type.Optional(Type.Object({
        adminOnly: Type.Optional(Type.Boolean({ default: true })),
    }))
});

const Email = Type.Object({
    _attributes: Type.Object({
        host: Type.String(),
        port: Type.Integer(),
        username: Type.String(),
        password: Type.String(),
        from: Type.String(),
        supportName: Type.String(),
        supportEmail: Type.String(),
        registrationPort: Type.Optional(Type.Integer({ default: 8446 })),
        logAlertsEnabled: Type.Optional(Type.Boolean({ default: false })),
        logAlertsTo: Type.Optional(Type.String()),
        logAlertsSubject: Type.Optional(Type.String()),
    }),
    whitelist: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            domain: Type.Optional(Type.String({ default: "" })),
            token: Type.Optional(Type.String({ default: "" })),
            privateGroup: Type.Optional(Type.Boolean({ default: false })),
            group: Type.Optional(Type.String({ default: "" })),
        }),
        groups: Type.Optional(Type.Array(Type.String()))
    }))),
    logAlertsExtension: Type.Optional(Type.Array(Type.String()))
});

const Profile = Type.Object({
    _attributes: Type.Optional(Type.Object({
        useStreamingGroup: Type.Optional(Type.Boolean({ default: false })),
    }))
});

const Locate = Type.Optional(Type.Object({
    _attributes: Type.Object({
        enabled: Type.Optional(Type.Boolean({ default: false })),
        requireLogin: Type.Optional(Type.Boolean({ default: true })),
        "cot-type": Type.Optional(Type.String({ default: "a-f-G" })),
        group: Type.String(),
        broadcast: Type.Optional(Type.Boolean({ default: true })),
        addToMission: Type.Optional(Type.Boolean({ default: true })),
        mission: Type.Optional(Type.String())
    })
}))

const Plugins = Type.Object({
    _attributes: Type.Optional(Type.Object({
        usePluginMessageQueue: Type.Optional(Type.Boolean({ default: true })),
        allowPluginContacts: Type.Optional(Type.Boolean({ default: false })),
        pluginContactCleanupFrequencySeconds: Type.Optional(Type.Integer({ default: 60 })),
    }))
});

const Cluster = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enabled: Type.Optional(Type.Boolean({ default: false })),
        natsURL: Type.Optional(Type.String({ default: "" })),
        natsClusterID: Type.Optional(Type.String({ default: "takserver-nats-streaming" })),
        kubernetes: Type.Optional(Type.Boolean({ default: false })),
        cacheConfig: Type.Optional(Type.Boolean({ default: true })),
        metricsIntervalDelaySeconds: Type.Optional(Type.Integer({ default: 5 })),
        metricsIntervalSeconds: Type.Optional(Type.Integer({ default: 60 })),
    }))
});

const Vbm = Type.Object({
    _attributes: Type.Optional(Type.Object({
        enabled: Type.Optional(Type.Boolean({ default: false })),
        disableSASharing: Type.Optional(Type.Boolean({ default: true })),
        disableChatSharing: Type.Optional(Type.Boolean({ default: false })),
        returnCopsWithPublicMissions: Type.Optional(Type.Boolean({ default: true })),
        ismUrl: Type.Optional(Type.String()),
        ismConnectTimeoutSeconds: Type.Optional(Type.Integer({ default: -1 })),
        ismReadTimeoutSeconds: Type.Optional(Type.Integer({ default: -1 })),
        ismStrictEnforcing: Type.Optional(Type.Boolean({ default: false })),
        networkClassification: Type.Optional(Type.String()),
    }))
});

const WebContent = Type.Object({
    accessFilter: Type.Optional(Type.Array(Type.Object({
        _attributes: Type.Object({
            folder: Type.Optional(Type.String())
        }),
        group: Type.Optional(Type.Array(Type.String()))
    })))
});

export default Type.Object({
    Configuration: Type.Object({
        _attributes: Type.Optional(Type.Object({
            xmlns: Type.Optional(Type.String()),
            forceLowConcurrency: Type.Optional(Type.Boolean({
                default: false
            }))
        })),
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
        profile: Type.Optional(Profile),
        webContent: Type.Optional(WebContent)
    })
});
