import cf from '@openaddresses/cloudfriend';

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
    },
    Outputs: {
        SourceDBParamGroup: {
            Description: 'Name of the source DB parameter group',
            Value: cf.ref('SourceDBParamGroup')
        },
    }
};
