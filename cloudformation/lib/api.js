import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        EnableExecute: {
            Description: 'Allow SSH into docker container - should only be enabled for limited debugging',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'false'
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
        LDAPDomain: {
            Description: 'LDAPDomain',
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
        Logs: {
            Type: 'AWS::Logs::LogGroup',
            Properties: {
                LogGroupName: cf.stackName,
                RetentionInDays: 7
            }
        },
        ELB: {
            Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
            Properties: {
                Name: cf.stackName,
                Type: 'network',
                SecurityGroups: [cf.ref('ELBSecurityGroup')],
                Subnets: [
                    cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-subnet-public-a'])),
                    cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-subnet-public-b']))
                ]
            }

        },
        ELBSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'elb-sg'])
                }],
                GroupDescription: 'Allow TAK Traffic into ELB',
                SecurityGroupIngress: [{
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443
                }, {
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 8443,
                    ToPort: 8443
                }, {
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 8446,
                    ToPort: 8446
                }, {
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80
                }],
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc']))
            }
        },
        Listener443: {
            Type: 'AWS::ElasticLoadBalancingV2::Listener',
            Properties: {
                DefaultActions: [{
                    Type: 'forward',
                    TargetGroupArn: cf.ref('TargetGroup8443')
                }],
                LoadBalancerArn: cf.ref('ELB'),
                Port: 443,
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
                LoadBalancerArn: cf.ref('ELB'),
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
                LoadBalancerArn: cf.ref('ELB'),
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
                LoadBalancerArn: cf.ref('ELB'),
                Port: 8089,
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
                LoadBalancerArn: cf.ref('ELB'),
                Port: 80,
                Protocol: 'TCP'
            }
        },
        TargetGroup8443: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            DependsOn: 'ELB',
            Properties: {
                Port: 8443,
                Protocol: 'TCP',
                TargetType: 'ip',
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),

                HealthCheckEnabled: false,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 8443,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 5
            }
        },
        TargetGroup8446: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            DependsOn: 'ELB',
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
                HealthyThresholdCount: 5
            }
        },
        TargetGroup8089: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            DependsOn: 'ELB',
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
                HealthyThresholdCount: 5
            }
        },
        TargetGroup80: {
            Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
            DependsOn: 'ELB',
            Properties: {
                Port: 80,
                Protocol: 'TCP',
                TargetType: 'ip',
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),

                HealthCheckEnabled: false,
                HealthCheckIntervalSeconds: 30,
                HealthCheckPort: 80,
                HealthCheckProtocol: 'TCP',
                HealthCheckTimeoutSeconds: 10,
                HealthyThresholdCount: 5
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
                        }, {
                            Effect: 'Allow',
                            Action: [
                                'kms:Decrypt',
                                'kms:GenerateDataKey'
                            ],
                            Resource: [cf.getAtt('KMS', 'Arn')]
                        }, {
                            Effect: 'Allow',
                            Action: [
                                'secretsmanager:Describe*',
                                'secretsmanager:Get*',
                                'secretsmanager:List*'
                            ],
                            Resource: [
                                cf.join(['arn:', cf.partition, ':secretsmanager:', cf.region, ':', cf.accountId, ':secret:', cf.stackName, '/*'])
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
                    Name: cf.stackName,
                    EFSVolumeConfiguration: {
                        FilesystemId: cf.ref('EFSFileSystem')
                    }
                }],
                ContainerDefinitions: [{
                    Name: 'api',
                    Image: cf.join([cf.accountId, '.dkr.ecr.', cf.region, '.amazonaws.com/coe-ecr-tak:', cf.ref('GitSha')]),
                    MountPoints: [{
                        ContainerPath: '/opt/tak',
                        SourceVolume: cf.stackName
                    }],
                    PortMappings: [{
                        ContainerPort: 8443
                    }, {
                        ContainerPort: 8446
                    }, {
                        ContainerPort: 8089
                    }, {
                        ContainerPort: 80
                    }],
                    Environment: [{
                        Name: 'LDAP_Domain',
                        Value: cf.ref('LDAPDomain')
                    }, {
                        Name: 'LDAP_SECURE_URL',
                        Value: cf.ref('LDAPSecureUrl')
                    }, {
                        Name: 'StackName',
                        Value: cf.stackName
                    }, {
                        Name: 'HostedEmail',
                        Value: cf.ref('HostedEmail')
                    }, {
                        Name: 'HostedDomain',
                        Value: cf.ref('HostedDomain')
                    }, {
                        Name: 'PostgresUsername',
                        Value: cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:username:AWSCURRENT}}')
                    }, {
                        Name: 'PostgresPassword',
                        Value: cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:password:AWSCURRENT}}')
                    }, {
                        Name: 'PostgresURL',
                        Value: cf.join(['postgresql://', cf.getAtt('DBInstance', 'Endpoint.Address'), ':5432/tak_ps_etl'])
                    }, {
                        Name: 'STATE',
                        Value: cf.ref('CertificateState')
                    }, {
                        Name: 'CITY',
                        Value: cf.ref('CertificateCity')
                    }, {
                        Name: 'ORGANIZATION',
                        Value: cf.ref('CertificateOrg')
                    }, {
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
                        AssignPublicIp: 'ENABLED',
                        SecurityGroups: [cf.ref('ServiceSecurityGroup')],
                        Subnets: [
                            cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-subnet-public-a'])),
                            cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-subnet-public-b']))
                        ]
                    }
                },
                LoadBalancers: [{
                    ContainerName: 'api',
                    ContainerPort: 8443,
                    TargetGroupArn: cf.ref('TargetGroup8443')
                }, {
                    ContainerName: 'api',
                    ContainerPort: 8446,
                    TargetGroupArn: cf.ref('TargetGroup8446')
                }, {
                    ContainerName: 'api',
                    ContainerPort: 8089,
                    TargetGroupArn: cf.ref('TargetGroup8089')
                }, {
                    ContainerName: 'api',
                    ContainerPort: 80,
                    TargetGroupArn: cf.ref('TargetGroup80')
                }]
            }
        },
        ServiceSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'ec2-sg'])
                }],
                GroupDescription: 'Allow access to TAK ports',
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),
                SecurityGroupIngress: [{
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 8443,
                    ToPort: 8443
                }, {
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 8446,
                    ToPort: 8446
                }, {
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 8089,
                    ToPort: 8089
                }, {
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80
                }]
            }
        },
        ETLFunctionRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                RoleName: cf.stackName,
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }]
                },
                Path: '/',
                Policies: [],
                ManagedPolicyArns: [
                    cf.join(['arn:', cf.partition, ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'])
                ]
            }
        }
    },
    Outputs: {
        API: {
            Description: 'API ELB',
            Value: cf.join(['http://', cf.getAtt('ELB', 'DNSName')])
        }
    }
};
