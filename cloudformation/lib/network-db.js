import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        DatabaseType: {
            Type: 'String',
            Default: 'db.t4g.large',
            Description: 'Database size to create',
            AllowedValues: [
                'db.t4g.large'
            ]
        },
        DatabaseVersion: {
            Description: 'PostgreSQL database engine version',
            Type: 'String',
            Default: '17.4'
        }
    },
    Resources: {
        DBMasterSecret: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' RDS Master Password']),
                GenerateSecretString: {
                    SecretStringTemplate: '{"username": "tak"}',
                    GenerateStringKey: 'password',
                    ExcludePunctuation: true,
                    PasswordLength: 64
                },
                Name: cf.join([cf.stackName, '/rds/secret']),
                KmsKeyId: cf.ref('KMS')
            }
        },
        DBMasterSecretAttachment: {
            Type: 'AWS::SecretsManager::SecretTargetAttachment',
            Properties: {
                SecretId: cf.ref('DBMasterSecret'),
                TargetId: cf.ref('DBCluster'),
                TargetType: 'AWS::RDS::DBCluster'
            }
        },
        DBMonitoringRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Sid: '',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'monitoring.rds.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }]
                },
                ManagedPolicyArns: [
                    cf.join(['arn:', cf.partition, ':iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'])
                ],
                Path: '/'
            }
        },
        DBCluster: {
            Type: 'AWS::RDS::DBCluster',
            DependsOn: ['DBMasterSecret'],
            DeletionPolicy: 'Snapshot',
            UpdateReplacePolicy: 'Snapshot',
            Properties: {
                Engine: 'aurora-postgresql',
                EngineVersion: cf.ref('DatabaseVersion'),
                EngineMode: 'provisioned',
                DatabaseName: 'takserver',
                Port: 5432,
                NetworkType: 'DUAL',
                DBClusterIdentifier: cf.stackName,
                MasterUsername: cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:username:AWSCURRENT}}'),
                MasterUserPassword: cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:password:AWSCURRENT}}'),
                DBSubnetGroupName: cf.ref('DBSubnet'),
                PreferredMaintenanceWindow: 'Sun:23:00-Sun:23:30',
                PreferredBackupWindow: '22:00-23:00',
                PerformanceInsightsEnabled: true,
                PerformanceInsightsKmsKeyId: cf.ref('KMS'),
                PerformanceInsightsRetentionPeriod: 7,
                VpcSecurityGroupIds: [cf.ref('DBVPCSecurityGroup')],
                StorageEncrypted: true,
                DeletionProtection: true,
                CopyTagsToSnapshot: true,
            }
        },
        DBInstanceA: {
            Type: 'AWS::RDS::DBInstance',
            DependsOn: ['DBMasterSecret'],
            Properties: {
                DBClusterIdentifier: cf.ref('DBCluster'),
                DBInstanceClass: cf.ref('DatabaseType'),
                Engine: 'aurora-postgresql'
            }
        },
        DBInstanceB: {
            Type: 'AWS::RDS::DBInstance',
            Condition: 'CreateProdResources',
            DependsOn: ['DBMasterSecret'],
            Properties: {
                DBClusterIdentifier: cf.ref('DBCluster'),
                DBInstanceClass: cf.ref('DatabaseType'),
                Engine: 'aurora-postgresql'
            }
        },
        DBSubnet: {
            Type: 'AWS::RDS::DBSubnetGroup',
            Properties: {
                DBSubnetGroupDescription: cf.join('-', [cf.stackName, 'rds-subnets']),
                SubnetIds: [
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-private-a'])),
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-private-b']))
                ]
            }
        },
        DBVPCSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'rds-sg'])
                }],
                GroupName: cf.join('-', [cf.stackName, 'rds-sg']),
                GroupDescription: 'Allow RDS Database Ingress',
                VpcId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc'])),
                SecurityGroupIngress: [{
                    IpProtocol: 'TCP',
                    FromPort: 5432,
                    ToPort: 5432,
                    SourceSecurityGroupId: cf.getAtt('ServiceSecurityGroup', 'GroupId')
                },{
                    IpProtocol: 'TCP',
                    FromPort: 5432,
                    ToPort: 5432,
                    CidrIp: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc-cidr'])),
                    Description: 'Allow Internal network access'
                }]
            }
        }
    },
    Outputs: {
        DBEndpoint: {
            Description: 'RDS Database Endpoint',
            Export: {
                Name: cf.join([cf.stackName, '-db-endpoint'])
            },
            Value: cf.getAtt('DBCluster', 'Endpoint.Address')
        },
        DB: {
            Description: 'Postgres Connection String',
            Value: cf.join([
                'postgresql://',
                cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:username:AWSCURRENT}}'),
                ':',
                cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:password:AWSCURRENT}}'),
                '@',
                cf.getAtt('DBCluster', 'Endpoint.Address'),
                ':',
                cf.getAtt('DBCluster', 'Endpoint.Port'),
                '/takserver',
            ])
        }
    }
};
