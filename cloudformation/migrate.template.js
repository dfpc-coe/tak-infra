import cf from '@openaddresses/cloudfriend';

// Steps:
// Migrate DB to VPCv2 using Console
// Deploy this stack to create DMS resources
// Associate the DB with the new parameter group and reboot to apply changes
//   aws rds reboot-db-instance --db-instance-identifier cotak-takserver-staging-db
// Verify replication:
//   SELECT name, setting FROM pg_settings WHERE name IN ('rds.logical_replication', 'wal_level', 'max_wal_senders', 'max_replication_slots');
// Ensure logging role is present: Go to DMS Task => Monitoring => Ensure header isn't present prompting to create role

const defaultTableMappings = JSON.stringify({
    rules: [{
        'rule-type': 'selection',
        'rule-id': '1',
        'rule-name': 'include-all',
        'object-locator': {
            'schema-name': '%',
            'table-name': '%'
        },
        'rule-action': 'include'
    }]
});

export default {
    Description: 'AWS DMS resources to migrate data into the tak-infra Postgres cluster',
    Parameters: {
        GitSha: {
            Description: 'GitSha that is currently being deployed',
            Type: 'String'
        },
        Environment: {
            Description: 'VPC/ECS Stack to deploy into',
            Type: 'String',
            Default: 'prod'
        },
        SourceServerName: {
            Description: 'Hostname or address of the source database',
            Type: 'String'
        },
        SourcePort: {
            Description: 'Port for the source database',
            Type: 'Number',
            Default: 5432
        },
        SourceDatabaseName: {
            Description: 'Name of the source database to migrate from',
            Type: 'String'
        },
        SourceUsername: {
            Description: 'Username for the source database',
            Type: 'String'
        },
        SourcePassword: {
            Description: 'Password for the source database',
            Type: 'String',
            NoEcho: true
        },
        ReplicationInstanceClass: {
            Description: 'DMS replication instance class',
            Type: 'String',
            Default: 'dms.r5.large'
        },
        ReplicationInstanceAllocatedStorage: {
            Description: 'Allocated storage (GB) for the DMS replication instance',
            Type: 'Number',
            Default: 100
        },
        MigrationType: {
            Description: 'DMS migration type',
            Type: 'String',
            AllowedValues: ['full-load', 'cdc', 'full-load-and-cdc'],
            Default: 'full-load-and-cdc'
        }
    },
    Resources: {
        SourceDBParamGroup: {
            Type: 'AWS::RDS::DBParameterGroup',
            Properties: {
                Description: 'Parameter group for source DB',
                Family: 'postgres15',
                Parameters: {
                    shared_preload_libraries: 'pglogical,pg_stat_statements',
                    'rds.logical_replication': '1',
                    wal_sender_timeout: '0'
                },
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'source-param-group'])
                }]
            }
        },
        DMSSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                GroupDescription: 'Security group for DMS replication instance',
                VpcId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc'])),
                GroupName: cf.join('-', [cf.stackName, 'dms-sg']),
                SecurityGroupEgress: [{
                    IpProtocol: '-1',
                    CidrIp: '0.0.0.0/0'
                }],
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'dms-sg'])
                }]
            }
        },
        DMSSubnetGroup: {
            Type: 'AWS::DMS::ReplicationSubnetGroup',
            DependsOn: ['DMSVPCRole'],
            Properties: {
                ReplicationSubnetGroupDescription: 'Subnets for AWS DMS replication instance',
                SubnetIds: [
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-private-a'])),
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-private-b']))
                ],
                ReplicationSubnetGroupIdentifier: cf.join('-', [cf.stackName, 'dms-subnets'])
            }
        },
        DMSVPCRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                RoleName: 'dms-vpc-role',
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            Service: 'dms.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }]
                },
                ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole']
            }
        },
        DMSReplicationInstance: {
            Type: 'AWS::DMS::ReplicationInstance',
            Properties: {
                AllocatedStorage: cf.ref('ReplicationInstanceAllocatedStorage'),
                PubliclyAccessible: false,
                MultiAZ: false,
                ReplicationInstanceClass: cf.ref('ReplicationInstanceClass'),
                ReplicationSubnetGroupIdentifier: cf.ref('DMSSubnetGroup'),
                VpcSecurityGroupIds: [cf.ref('DMSSecurityGroup')],
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'dms'])
                }]
            }
        },
        SourceEndpoint: {
            Type: 'AWS::DMS::Endpoint',
            Properties: {
                EndpointType: 'source',
                EngineName: 'postgres',
                ExtraConnectionAttributes: 'PluginName=pglogical',
                ServerName: cf.ref('SourceServerName'),
                Port: cf.ref('SourcePort'),
                DatabaseName: cf.ref('SourceDatabaseName'),
                SslMode: 'require',
                Username: cf.ref('SourceUsername'),
                Password: cf.ref('SourcePassword')
            }
        },
        TargetEndpoint: {
            Type: 'AWS::DMS::Endpoint',
            Properties: {
                EndpointType: 'target',
                EngineName: 'aurora-postgresql',
                ServerName: cf.importValue(cf.join(['tak-server-network-', cf.ref('Environment'), '-db-endpoint'])),
                Port: 5432,
                DatabaseName: 'takserver',
                SslMode: 'require',
                Username: cf.sub('{{resolve:secretsmanager:tak-server-network-${Environment}/rds/secret:SecretString:username}}'),
                Password: cf.sub('{{resolve:secretsmanager:tak-server-network-${Environment}/rds/secret:SecretString:password}}')
            }
        },
        ReplicationTask: {
            Type: 'AWS::DMS::ReplicationTask',
            Properties: {
                MigrationType: cf.ref('MigrationType'),
                ReplicationInstanceArn: cf.ref('DMSReplicationInstance'),
                SourceEndpointArn: cf.ref('SourceEndpoint'),
                TargetEndpointArn: cf.ref('TargetEndpoint'),
                TableMappings: defaultTableMappings,
                ReplicationTaskSettings: JSON.stringify({
                    TargetMetadata: {
                        TargetTablePrepMode: 'TRUNCATE_BEFORE_LOAD',
                        FullLobMode: true,
                        LobChunkSize: 64,
                        SupportLobs: true,
                        ParallelLoadBufferSize: 0
                    },
                    Logging: { EnableLogging: true }
                })
            }
        }
    },
    Outputs: {
        SourceDBParamGroup: {
            Description: 'Name of the source DB parameter group',
            Value: cf.ref('SourceDBParamGroup')
        },
        ReplicationInstanceArn: {
            Description: 'ARN of the DMS replication instance',
            Value: cf.ref('DMSReplicationInstance')
        },
        SourceEndpointArn: {
            Description: 'ARN of the DMS source endpoint',
            Value: cf.ref('SourceEndpoint')
        },
        TargetEndpointArn: {
            Description: 'ARN of the DMS target endpoint',
            Value: cf.ref('TargetEndpoint')
        },
        ReplicationTaskArn: {
            Description: 'ARN of the DMS replication task',
            Value: cf.ref('ReplicationTask')
        }
    }
};
