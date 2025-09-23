import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        DatabaseType: {
            Type: 'String',
            Default: 'db.t3.micro',
            Description: 'Database size to create',
            AllowedValues: [
                'db.t3.micro',
                'db.m6g.large'
            ]
        },
        DatabaseVersion: {
            Description: 'PostgreSQL database engine version',
            Type: 'String',
            Default: '17.4'
        },
        DatabaseMultiAZ: {
            Description: 'PostgreSQL database as a Multi-AZ deployment',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'false'
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
                Port: 5432,
                DatabaseName: 'takserver',
                CopyTagsToSnapshot: true,
                MonitoringInterval: 60,
                MonitoringRoleArn: cf.getAtt('DBMonitoringRole', 'Arn'),
                KmsKeyId: cf.ref('KMS'),
                EngineVersion: cf.ref('DatabaseVersion'),
                StorageEncrypted: true,
                MasterUsername: cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:username:AWSCURRENT}}'),
                MasterUserPassword: cf.sub('{{resolve:secretsmanager:${AWS::StackName}/rds/secret:SecretString:password:AWSCURRENT}}'),
                BackupRetentionPeriod: 10,
                StorageType: 'aurora',
                DBSubnetGroupName: cf.ref('DBSubnet'),
                DeletionProtection: true
            }
        },
        DBFirstInstance: {
            Type: 'AWS::RDS::DBInstance',
            DependsOn: ['DBMasterSecret'],
            Properties: {
                DBClusterIdentifier: cf.ref('DBCluster'),
                Engine: 'aurora-postgresql',
                EngineVersion: cf.ref('DatabaseVersion'),
                AllowMajorVersionUpgrade: false,
                DBInstanceIdentifier: cf.join([cf.stackName, '-primary']),
                MonitoringInterval: 60,
                MonitoringRoleArn: cf.getAtt('DBMonitoringRole', 'Arn'),
                EnablePerformanceInsights: 'true',
                PerformanceInsightsKMSKeyId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-kms'])),
                PerformanceInsightsRetentionPeriod: 7,
                DBInstanceClass: 'db.t4g.large'
            }
        },
        DBSecondInstance: {
            Type: 'AWS::RDS::DBInstance',
            Condition: 'CreateProdResources',
            DependsOn: ['DBMasterSecret'],
            Properties: {
                DBClusterIdentifier: cf.ref('DBCluster'),
                Engine: 'aurora-postgresql',
                EngineVersion: cf.ref('DatabaseVersion'),
                AllowMajorVersionUpgrade: false,
                DBInstanceIdentifier: cf.join([cf.stackName, '-secondary']),
                MonitoringInterval: 60,
                MonitoringRoleArn: cf.getAtt('DBMonitoringRole', 'Arn'),
                EnablePerformanceInsights: 'true',
                PerformanceInsightsKMSKeyId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-kms'])),
                PerformanceInsightsRetentionPeriod: 7,
                DBInstanceClass: 'db.t4g.large'
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
                    IpProtocol: '-1',
                    FromPort: 5432,
                    ToPort: 5432,
                    SourceSecurityGroupId: cf.getAtt('ServiceSecurityGroup', 'GroupId')
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
                ':5432/tak_ps_etl'
            ])
        }
    }
};
