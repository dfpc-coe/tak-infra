import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        ConfigBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
                BucketName: cf.join('-', [cf.stackName, cf.accountId, cf.region]),
                VersioningConfiguration: {
                    Status: 'Enabled'
                }
            }
        }
    }
};
