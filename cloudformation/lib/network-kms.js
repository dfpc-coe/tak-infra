import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        KMSAlias: {
            Type: 'AWS::KMS::Alias',
            Properties: {
                AliasName: cf.join(['alias/', cf.stackName]),
                TargetKeyId: cf.ref('KMS')
            }
        },
        KMS: {
            Type : 'AWS::KMS::Key',
            Properties: {
                Description: cf.stackName,
                Enabled: true,
                EnableKeyRotation: false,
                KeyPolicy: {
                    Id: cf.stackName,
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            AWS: cf.join(['arn:', cf.partition, ':iam::', cf.accountId, ':root'])
                        },
                        Action: ['kms:*'],
                        Resource: '*'
                    }]
                }
            }
        },
        TAKRootCAPublic: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' TAK Root CA Public Cert']),
                Name: cf.join([cf.stackName, '/root-ca/public']),
                KmsKeyId: cf.ref('KMS')
            }
        },
        TAKRootCAPrviate: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' TAK Root CA Private Cert']),
                Name: cf.join([cf.stackName, '/root-ca/private']),
                KmsKeyId: cf.ref('KMS')
            }
        },
        TAKRootCARevoke: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' TAK Root CA Revocation Cert']),
                Name: cf.join([cf.stackName, '/root-ca/revoke']),
                KmsKeyId: cf.ref('KMS')
            }
        },
        TAKIntermediateCert: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' TAK Intermediate Signing Cert']),
                Name: cf.join([cf.stackName, '/tak-int-ca']),
                KmsKeyId: cf.ref('KMS')
            }
        },
        TAKAdminP12Secret: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
                Description: cf.join([cf.stackName, ' TAK Server Admin Key (p12)']),
                Name: cf.join([cf.stackName, '/tak-admin-cert']),
                KmsKeyId: cf.ref('KMS')
            }
        }
    },
    Outputs: {
        KMS: {
            Description: 'KMS',
            Export: {
                Name: cf.join([cf.stackName, '-kms'])
            },
            Value: cf.getAtt('KMS', 'Arn')
        }
    }
};
