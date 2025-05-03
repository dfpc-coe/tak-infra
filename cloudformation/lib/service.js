import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        EnableExecute: {
            Description: 'Allow SSH into docker container - should only be enabled for limited debugging',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'false'
        },
        CertificateCountry: {
            Description: '2 Letter Country Code',
            Type: 'String',
            Default: 'US'
        },
        CertificateState: {
            Description: '2 Letter State Code',
            Type: 'String',
            Default: 'CO'
        },
        CertificateCity: {
            Description: 'City Name',
            Type: 'String',
            Default: 'Grand-Junction'
        },
        CertificateOrg: {
            Description: 'Organization',
            Type: 'String',
            Default: 'TAK'
        },
        CertificateOrgUnit: {
            Description: 'Organization Unit',
            Type: 'String',
            Default: 'TAK-Unit'
        },
        HostedDomain: {
            Description: 'Hosted Domain',
            Type: 'String'
        },
        HostedEmail: {
            Description: 'Hosted Email',
            Type: 'String'
        },
        LetsencryptProdCert: {
            Description: 'Issue Let\'s Encryp Production Certificate?',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'false'
        },
        LDAPDomain: {
            Description: 'LDAP Domain',
            Type: 'String',
            Default: 'example.com'
        },
        LDAPSecureUrl: {
            Description: 'LDAP Secure Connection URL',
            Type: 'String',
            Default: 'ldaps://example.com:636'
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
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-elb'])),
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
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-elb'])),
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
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-elb'])),
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
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-elb'])),
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
                LoadBalancerArn: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-elb'])),
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
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),

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
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),

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
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),

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
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),

                HealthCheckEnabled: true,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 8089,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 2
            }
        },
        TaskDefinition: {
            Type: 'AWS::ECS::TaskDefinition',
            Properties: {
                Family: cf.stackName,
                Cpu: 1024 * 4,
                Memory: 4096 * 4,
                NetworkMode: 'awsvpc',
                RequiresCompatibilities: ['FARGATE'],
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'api'])
                }],
                ExecutionRoleArn: cf.getAtt('ExecRole', 'Arn'),
                TaskRoleArn: cf.getAtt('TaskRole', 'Arn'),
                Volumes: [{
                    Name: cf.join([cf.stackName, '-tak']),
                    EFSVolumeConfiguration: {
                        FilesystemId: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-efs'])),
                        TransitEncryption: 'ENABLED',
                        AuthorizationConfig: {
                            AccessPointId: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-efs-ap-certs']))
                        },
                        RootDirectory: '/'
                    }
                },{
                    Name: cf.join([cf.stackName, '-letsencrypt']),
                    EFSVolumeConfiguration: {
                        FilesystemId: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-efs'])),
                        TransitEncryption: 'ENABLED',
                        AuthorizationConfig: {
                            AccessPointId: cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-efs-ap-letsencrypt']))
                        },
                        RootDirectory: '/'
                    }
                }],
                ContainerDefinitions: [{
                    Name: 'api',
                    Image: cf.join([cf.accountId, '.dkr.ecr.', cf.region, '.amazonaws.com/coe-ecr-tak:', cf.ref('GitSha')]),
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
                    Environment: [{
                        Name: 'LDAP_Domain',
                        Value: cf.ref('LDAPDomain')
                    },{
                        Name: 'LDAP_SECURE_URL',
                        Value: cf.ref('LDAPSecureUrl')
                    },{
                        Name: 'StackName',
                        Value: cf.stackName
                    },{
                        Name: 'Environment',
                        Value: cf.ref('Environment')
                    },{
                        Name: 'HostedEmail',
                        Value: cf.ref('HostedEmail')
                    },{
                        Name: 'HostedDomain',
                        Value: cf.ref('HostedDomain')
                    },{
                        Name: 'LetsencryptProdCert',
                        Value: cf.ref('LetsencryptProdCert')
                    },{
                        Name: 'ECS_Cluster_Name',
                        Value: cf.join(['coe-ecs-', cf.ref('Environment')])
                    },{
                        Name: 'ECS_Service_Name',
                        Value: cf.join([cf.stackName,  '-Service'])
                    },{
                        Name: 'LDAP_Password',
                        Value: cf.sub('{{resolve:secretsmanager:coe-auth-${Environment}/svc:SecretString:password:AWSCURRENT}}')
                    },{
                        Name: 'PostgresUsername',
                        Value: cf.sub('{{resolve:secretsmanager:coe-tak-network-${Environment}/rds/secret:SecretString:username:AWSCURRENT}}')
                    },{
                        Name: 'PostgresPassword',
                        Value: cf.sub('{{resolve:secretsmanager:coe-tak-network-${Environment}/rds/secret:SecretString:password:AWSCURRENT}}')
                    },{
                        Name: 'PostgresURL',
                        Value: cf.join(['postgresql://', cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-db-endpoint'])), ':5432/tak_ps_etl'])
                    },{
                        Name: 'COUNTRY',
                        Value: cf.ref('CertificateCountry')
                    },{
                        Name: 'STATE',
                        Value: cf.ref('CertificateState')
                    },{
                        Name: 'CITY',
                        Value: cf.ref('CertificateCity')
                    },{
                        Name: 'ORGANIZATION',
                        Value: cf.ref('CertificateOrg')
                    },{
                        Name: 'ORGANIZATIONAL_UNIT',
                        Value: cf.ref('CertificateOrgUnit')
                    }],
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
                    PolicyName: cf.join('-', [cf.stackName, 'api-policy']),
                    PolicyDocument: {
                        Statement: [{
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
                                'kms:Decrypt',
                                'kms:GenerateDataKey'
                            ],
                            Resource: [
                                cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-kms']))
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'secretsmanager:Describe*',
                                'secretsmanager:Get*',
                                'secretsmanager:List*'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:coe-tak-network-', cf.ref('Environment'), '/*'])
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'secretsmanager:Put*'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:coe-tak-network-', cf.ref('Environment'), '/tak-admin-cert']),

                                // This is a wildcard as the generated ARN is occasionally prefixed with a random hash
                                // IE: coe-tak-network-cotak-staging/root-ca/revoke-m43Ei7
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:coe-tak-network-', cf.ref('Environment'), '/root-ca/*']),
                            ]
                        },{
                            Effect: 'Allow',
                            Action: [
                                'ecs:UpdateService'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':ecs:', cf.region, ':', cf.accountId, ':service/coe-ecs-', cf.ref('Environment'), '/', cf.stackName, '-Service'])
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
                    PolicyName: cf.join([cf.stackName, '-api-logging']),
                    PolicyDocument: {
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents',
                                'logs:DescribeLogStreams'
                            ],
                            Resource: [cf.join(['arn:', cf.partition, ':logs:*:*:*'])]
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
                Cluster: cf.join(['coe-ecs-', cf.ref('Environment')]),
                TaskDefinition: cf.ref('TaskDefinition'),
                HealthCheckGracePeriodSeconds: 300,
                LaunchType: 'FARGATE',
                PropagateTags: 'SERVICE',
                EnableExecuteCommand: cf.ref('EnableExecute'),
                DesiredCount: 1,
                NetworkConfiguration: {
                    AwsvpcConfiguration: {
                        AssignPublicIp: 'DISABLED',
                        SecurityGroups: [
                            cf.importValue(cf.join(['coe-tak-network-', cf.ref('Environment'), '-service-sg']))
                        ],
                        Subnets:  [
                            cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-subnet-private-a'])),
                            cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-subnet-private-b']))
                        ]
                    }
                },
                LoadBalancers: [{
                    ContainerName: 'api',
                    ContainerPort: 8443,
                    TargetGroupArn: cf.ref('TargetGroup8443')
                },{
                    ContainerName: 'api',
                    ContainerPort: 80,
                    TargetGroupArn: cf.ref('TargetGroup80')
                },{
                    ContainerName: 'api',
                    ContainerPort: 8446,
                    TargetGroupArn: cf.ref('TargetGroup8446')
                },{
                    ContainerName: 'api',
                    ContainerPort: 8089,
                    TargetGroupArn: cf.ref('TargetGroup8089')
                }]
            }
        }
    }
};
