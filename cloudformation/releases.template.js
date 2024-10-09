import cf from '@openaddresses/cloudfriend';

/**
 * Note this repo is designed to be managed by a single root administrator
 * You do not need to deploy or manage this template
 */

export default cf.merge({
    Description: 'Host TAK Server Release Packages',
    Parameters: {
        GitSha: {
            Description: 'GitSha that is currently being deployed',
            Type: 'String'
        }
    },
    Resources: {
        AssetBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
                BucketName: 'tak-server-releases',
                OwnershipControls: {
                    Rules: [{
                        ObjectOwnership: 'BucketOwnerEnforced'
                    }]
                },
                "WebsiteConfiguration": {
                    "IndexDocument":"index.html",
                    "ErrorDocument":"404.html"
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: false,
                    BlockPublicPolicy: false,
                    IgnorePublicAcls: false,
                    RestrictPublicBuckets: false
                }
            }
        }
    },
    Outputs: {
        Website: {
            Description: 'API Root',
            Value: cf.getAtt('AssetBucket', 'Arn')
        }
    }
});
