import cf from '@openaddresses/cloudfriend';

export default cf.merge({
    Description: 'Host TAK Server Release Packages',
    Parameters: {
        GitSha: {
            Description: 'GitSha that is currently being deployed',
            Type: 'String'
        }
    },
    Resources: {
        AssetBucketPolicy: {
            Type: 'AWS::S3::BucketPolicy',
            Properties: {
                Bucket: cf.ref('AssetBucket'),
                PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Sid: 'Statement1',
                        Effect: 'Allow',
                        Principal: '*',
                        Action: [
                            's3:GetObject',
                            's3:ListObjects',
                            's3:HeadObject'
                        ],
                        Resource: [
                            cf.join(['arn:', cf.partition, ':s3:::', cf.ref('AssetBucket'), '/*']),
                            cf.join(['arn:', cf.partition, ':s3:::', cf.ref('AssetBucket')])
                        ]
                    }]
                }
            }
        },
        AssetBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
                BucketName: 'tak-server-releases',
                OwnershipControls: {
                    Rules: [{
                        ObjectOwnership: 'BucketOwnerEnforced'
                    }]
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: false,
                    BlockPublicPolicy: false,
                    IgnorePublicAcls: false,
                    RestrictPublicBuckets: false
                }
            }
        }
    }
});
