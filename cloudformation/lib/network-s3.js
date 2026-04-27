import cf from '@openaddresses/cloudfriend';

export default {
    Conditions: {
        CreateLegacyConfigBucket: cf.equals('true', 'false')
    },
    Resources: {
        ConfigBucket: {
            Condition: 'CreateLegacyConfigBucket',
            Type: 'AWS::S3::Bucket',
            DeletionPolicy: 'Retain',
            UpdateReplacePolicy: 'Retain',
            Properties: {
                BucketName: cf.join('-', [cf.stackName, cf.accountId, cf.region]),
                VersioningConfiguration: {
                    Status: 'Enabled'
                }
            }
        }
    }
};
