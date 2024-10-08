import cf from '@openaddresses/cloudfriend';

export default cf.merge({
    Description: 'Host TAK Server Release Packages',
    Parameters: {
        GitSha: {
            Description: 'GitSha that is currently being deployed',
            Type: 'String'
        },
    },
    Resources: {
        AssetBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
                BucketName: 'tak-server-releases'
            }
        }
    }
});
