import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        EnableExecute: {
            Description: 'Allow SSH into docker container - should only be enabled for limited debugging',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'false'
        },
//        CertificateCountry: {
//            Description: '2 Letter Country Code',
//            Type: 'String',
//            Default: 'NZ'
//        },
//        CertificateState: {
//            Description: 'Region or state name or code',
//            Type: 'String',
//            Default: 'Wellington'
//        },
//        CertificateCity: {
//            Description: 'City Name',
//            Type: 'String',
//           Default: 'Wellington'
//        },
//        CertificateOrg: {
//            Description: 'Organization',
//            Type: 'String',
//            Default: 'TAK-NZ'
//        },
//        CertificateOrgUnit: {
//            Description: 'Organization Unit',
//            Type: 'String',
//            Default: 'TAK'
//        },
//        HostedDomain: {
//            Description: 'Hosted Domain',
//            Type: 'String',
//            Default: 'ops.exampletak.com'
//        },
//        HostedEmail: {
//            Description: 'Hosted Email',
//            Type: 'String'
//        },
//        LetsencryptProdCert: {
//            Description: 'Issue Let\'s Encrypt Production Certificate?',
//            Type: 'String',
//            AllowedValues: ['true', 'false'],
//            Default: 'false'
//        },
        LDAPDN: {
            Description: 'LDAP Base DN',
            Type: 'String',
            Default: 'DC=example,DC=com'
        },
        LDAPSecureUrl: {
            Description: 'LDAP Secure Connection URL',
            Type: 'String',
            Default: 'ldaps://example.com:636'
        },
        TAKConfigFile: {
            Description: 'Use takserver-config.env config file in S3 bucket',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'false'
        },
        DockerImageLocation: {
            Description: 'Use the docker image from Github or the local AWS ECR?',
            Type: 'String',
            AllowedValues: ['Github', 'Local ECR'],
            Default: 'Github'
        }
    },
    Resources: {
        Listener443: {
            Type: 'AWS::ElasticLoadBalancingV2::Listener',
            Properties: {
                DefaultActions: [{
                    Type: 'forward',
                    TargetGroupArn: cf.ref('TargetGroup8446')
                }],
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-elb'])),
                Port: 443,
                Protocol: 'TCP'
            }
        },
        Listener80: {
            Type: 'AWS::ElasticLoadBalancingV2::Listener',
            Properties: {
                DefaultActions: [{
                    Type: 'forward',
                    TargetGroupArn: cf.ref('TargetGroup80')
                }],
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-elb'])),
                Port: 80,
                Protocol: 'TCP'
            }
        },
        Listener8443: {
            Type: 'AWS::ElasticLoadBalancingV2::Listener',
            Properties: {
                DefaultActions: [{
                    Type: 'forward',
                    TargetGroupArn: cf.ref('TargetGroup8443')
                }],
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-elb'])),
                Port: 8443,
                Protocol: 'TCP'
            }
        },
        Listener8446: {
            Type: 'AWS::ElasticLoadBalancingV2::Listener',
            Properties: {
                DefaultActions: [{
                    Type: 'forward',
                    TargetGroupArn: cf.ref('TargetGroup8446')
                }],
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-elb'])),
                Port: 8446,
                Protocol: 'TCP'
            }
        },
        Listener8089: {
            Type: 'AWS::ElasticLoadBalancingV2::Listener',
            Properties: {
                DefaultActions: [{
                    Type: 'forward',
                    TargetGroupArn: cf.ref('TargetGroup8089')
                }],
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-elb'])),
                Port: 8089,
                Protocol: 'TCP'
            }
        },
        TargetGroup8443: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            Properties: {
                Port: 8443,
                Protocol: 'TCP',
                TargetType: 'ip',
                VpcId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-vpc-id'])),

                HealthCheckEnabled: true,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 8443,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 2
            }
        },
        TargetGroup80: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            Properties: {
                Port: 80,
                Protocol: 'TCP',
                TargetType: 'ip',
                VpcId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-vpc-id'])),

                HealthCheckEnabled: true,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 8446,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 2
            }
        },
        TargetGroup8446: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            Properties: {
                Port: 8446,
                Protocol: 'TCP',
                TargetType: 'ip',
                VpcId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-vpc-id'])),

                HealthCheckEnabled: true,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 8446,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 2
            }
        },
        TargetGroup8089: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            Properties: {
                Port: 8089,
                Protocol: 'TCP',
                TargetType: 'ip',
                VpcId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-vpc-id'])),

                HealthCheckEnabled: true,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 8089,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 2
            }
        },
        TAKAdminP12Secret: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' TAK Server Admin key (p12)']),
                Name: cf.join([cf.stackName, '/tak-admin-cert']),
                KmsKeyId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-kms']))
            }
        },
        TaskDefinition: {
            Type: 'AWS::ECS::TaskDefinition',
            Properties: {
                Family: cf.stackName,
                // Task Size options: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
                Cpu: cf.if('CreateProdResources', 1024 * 4, 1024 * 2),
                Memory: cf.if('CreateProdResources', 1024 * 8, 1024 * 4),
                NetworkMode: 'awsvpc',
                RequiresCompatibilities: ['FARGATE'],
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'takserver'])
                }],
                ExecutionRoleArn: cf.getAtt('ExecRole', 'Arn'),
                TaskRoleArn: cf.getAtt('TaskRole', 'Arn'),
                Volumes: [{
                    Name: cf.join([cf.stackName, '-tak']),
                    EFSVolumeConfiguration: {
                        FilesystemId: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-efs'])),
                        TransitEncryption: 'ENABLED',
                        AuthorizationConfig: {
                            AccessPointId: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-efs-ap-certs']))
                        },
                        RootDirectory: '/'
                    }
                },{
                    Name: cf.join([cf.stackName, '-letsencrypt']),
                    EFSVolumeConfiguration: {
                        FilesystemId: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-efs'])),
                        TransitEncryption: 'ENABLED',
                        AuthorizationConfig: {
                            AccessPointId: cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-efs-ap-letsencrypt']))
                        },
                        RootDirectory: '/'
                    }
                }],
                ContainerDefinitions: [{
                    Name: 'takserver',
                    HealthCheck: {
                        Command: [
                            'CMD-SHELL',
                            'curl -ks -o /dev/null https://localhost:8446 || exit 1'
                        ],
                        Interval: 30,
                        Retries: 3,
                        StartPeriod: 60,
                        Timeout: 30
                    },
                    Image: cf.if('DockerGithubImage',
                        'ghcr.io/tak-nz/takserver:latest',
                        cf.join([cf.accountId, '.dkr.ecr.', cf.region, '.amazonaws.com/coe-base-', cf.ref('Environment'), ':takserver-', cf.ref('GitSha')])
                    ),
                    MountPoints: [{
                        ContainerPath: '/opt/tak/certs/files',
                        SourceVolume: cf.join([cf.stackName, '-tak'])
                    },{
                        ContainerPath: '/etc/letsencrypt',
                        SourceVolume: cf.join([cf.stackName, '-letsencrypt'])
                    }],
                    PortMappings: [{
                        ContainerPort: 8443
                    },{
                        ContainerPort: 80
                    },{
                        ContainerPort: 8446
                    },{
                        ContainerPort: 8089
                    }],
                    Environment: [
                        { Name: 'LDAP_DN',              Value: cf.ref('LDAPDN') },
                        { Name: 'LDAP_SECURE_URL',      Value: cf.ref('LDAPSecureUrl') },
                        { Name: 'StackName',            Value: cf.stackName  },
                        { Name: 'Environment',          Value: cf.ref('Environment') },
                        { Name: 'ECS_Cluster_Name',     Value: cf.join(['coe-base-', cf.ref('Environment')]) },
                        { Name: 'ECS_Service_Name',     Value: cf.join([cf.stackName,  '-Service']) },
                        { Name: 'PostgresUsername',     Value: cf.sub('{{resolve:secretsmanager:coe-tak-base-${Environment}/rds/secret:SecretString:username:AWSCURRENT}}') },
                        { Name: 'PostgresURL',          Value: cf.join(['postgresql://', cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-db-endpoint'])), ':5432/takserver']) },
                        // { Name: 'HostedEmail',          Value: cf.ref('HostedEmail') },
                        // { Name: 'HostedDomain',         Value: cf.ref('HostedDomain') },
                        // { Name: 'LetsencryptProdCert',  Value: cf.ref('LetsencryptProdCert') },
                        // { Name: 'COUNTRY',              Value: cf.ref('CertificateCountry') },
                        // { Name: 'STATE',                Value: cf.ref('CertificateState') },
                        // { Name: 'CITY',                 Value: cf.ref('CertificateCity') },
                        // { Name: 'ORGANIZATION',         Value: cf.ref('CertificateOrg') },
                        // { Name: 'ORGANIZATIONAL_UNIT',  Value: cf.ref('CertificateOrgUnit') },
                    ],
                    Secrets: [
                        { Name: 'LDAP_Password',        ValueFrom: cf.join([cf.importValue(cf.join(['coe-auth-', cf.ref('Environment'), '-ldapservice-user'])), ':password::']) },
                        { Name: 'PostgresPassword',     ValueFrom: cf.join([cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-ldapservice-password'])), ':password::']) }
                    ],
                    EnvironmentFiles: [
                        cf.if('S3ConfigValueSet',
                            {
                                Value: cf.join([cf.join([cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-s3'])), '/takserver-config.env'])]),
                                Type: 's3'
                            },
                            cf.ref('AWS::NoValue')
                        )
                    ],
                    LogConfiguration: {
                        LogDriver: 'awslogs',
                        Options: {
                            'awslogs-group': cf.stackName,
                            'awslogs-region': cf.region,
                            'awslogs-stream-prefix': cf.stackName,
                            'awslogs-create-group': true
                        }
                    },
                    Essential: true
                }]
            }
        },
        TaskRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ecs-tasks.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }]
                },
                Policies: [{
                    PolicyName: cf.join('-', [cf.stackName, 'takserver-policy']),
                    PolicyDocument: {
                        Statement: [{
                            // ECS Exec permissions
                            Effect: 'Allow',
                            Action: [
                                'ssmmessages:CreateControlChannel',
                                'ssmmessages:CreateDataChannel',
                                'ssmmessages:OpenControlChannel',
                                'ssmmessages:OpenDataChannel'
                            ],
                            Resource: '*'
                        },{
                            Effect: 'Allow',
                            Action: [
                                'logs:CreateLogStream',
                                'logs:DescribeLogStreams',
                                'logs:PutLogEvents',
                                'logs:DescribeLogGroups'
                            ],
                            Resource: [cf.join(['arn:', cf.partition, ':logs:*:*:*'])]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'kms:Decrypt',
                                'kms:GenerateDataKey'
                            ],
                            Resource: [
                                cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-kms']))
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'secretsmanager:PutSecretValue'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:', cf.stackName, '/tak-admin-cert*'])
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'ecs:UpdateService'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':ecs:', cf.region, ':', cf.accountId, ':service/coe-base-', cf.ref('Environment'), '/', cf.stackName, '-Service'])
                            ]
                        }]
                    }
                }]
            }
        },
        ExecRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ecs-tasks.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }]
                },
                Policies: [{
                    PolicyName: cf.join([cf.stackName, '-takserver-logging']),
                    PolicyDocument: {
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            Resource: [cf.join(['arn:', cf.partition, ':logs:*:*:*'])]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'kms:Decrypt',
                                'kms:GenerateDataKey'
                            ],
                            Resource: [
                                cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-kms']))
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'secretsmanager:DescribeSecret',
                                'secretsmanager:GetSecretValue'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:', cf.stackName, '/*']),
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:coe-auth-', cf.ref('Environment'), '/*']),
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:coe-tak-base-', cf.ref('Environment'), '/*'])
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                's3:GetBucketLocation'
                            ],
                            Resource: [
                                cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-s3']))
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                's3:GetObject',
                            ],
                            Resource: [
                                cf.join([cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-s3'])), '/*'])
                            ]
                        }]
                    }
                }],
                ManagedPolicyArns: [
                    cf.join(['arn:', cf.partition, ':iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'])
                ],
                Path: '/service-role/'
            }
        },
        Service: {
            Type: 'AWS::ECS::Service',
            Properties: {
                ServiceName: cf.join('-', [cf.stackName, 'Service']),
                Cluster: cf.join(['coe-base-', cf.ref('Environment')]),
                TaskDefinition: cf.ref('TaskDefinition'),
                HealthCheckGracePeriodSeconds: 300,
                LaunchType: 'FARGATE',
                PropagateTags: 'SERVICE',
                EnableExecuteCommand: cf.ref('EnableExecute'),
                DesiredCount: 1,
                NetworkConfiguration: {
                    AwsvpcConfiguration: {
                        AssignPublicIp: 'ENABLED',
                        SecurityGroups: [
                            cf.importValue(cf.join(['coe-tak-base-', cf.ref('Environment'), '-service-sg']))
                        ],
                        Subnets:  [
                            cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-subnet-public-a'])),
                            cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-subnet-public-b']))
                        ]
                    }
                },
                LoadBalancers: [{
                    ContainerName: 'takserver',
                    ContainerPort: 8443,
                    TargetGroupArn: cf.ref('TargetGroup8443')
                },{
                    ContainerName: 'takserver',
                    ContainerPort: 80,
                    TargetGroupArn: cf.ref('TargetGroup80')
                },{
                    ContainerName: 'takserver',
                    ContainerPort: 8446,
                    TargetGroupArn: cf.ref('TargetGroup8446')
                },{
                    ContainerName: 'takserver',
                    ContainerPort: 8089,
                    TargetGroupArn: cf.ref('TargetGroup8089')
                }]
            }
        }
    },
    Conditions: {
        CreateProdResources: cf.equals(cf.ref('EnvType'), 'prod'),
        S3ConfigValueSet: cf.equals(cf.ref('TAKConfigFile'), true),
        DockerGithubImage: cf.equals(cf.ref('DockerImageLocation'), 'Github')
    }
};
