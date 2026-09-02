import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        FilesBucket: {
            Type: 'AWS::S3::Bucket',
            DeletionPolicy: 'Retain',
            UpdateReplacePolicy: 'Retain',
            Properties: {
                BucketName: cf.join('-', [cf.stackName, 'files', cf.accountId, cf.region]),
                VersioningConfiguration: {
                    Status: 'Enabled'
                },
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [{
                        BucketKeyEnabled: true,
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'aws:kms',
                            KMSMasterKeyID: cf.ref('KMS')
                        }
                    }]
                },
                OwnershipControls: {
                    Rules: [{
                        ObjectOwnership: 'BucketOwnerEnforced'
                    }]
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true
                }
            }
        },
        FilesRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            Service: 'elasticfilesystem.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole',
                        Condition: {
                            StringEquals: {
                                'aws:SourceAccount': cf.accountId
                            },
                            ArnLike: {
                                'aws:SourceArn': cf.join(['arn:', cf.partition, ':s3files:', cf.region, ':', cf.accountId, ':file-system/*'])
                            }
                        }
                    }]
                },
                Policies: [{
                    PolicyName: cf.join('-', [cf.stackName, 'files-sync']),
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                's3:ListBucket',
                                's3:ListBucketVersions'
                            ],
                            Resource: cf.getAtt('FilesBucket', 'Arn'),
                            Condition: {
                                StringEquals: {
                                    'aws:ResourceAccount': cf.accountId
                                }
                            }
                        },{
                            Effect: 'Allow',
                            Action: [
                                's3:AbortMultipartUpload',
                                's3:DeleteObject*',
                                's3:GetObject*',
                                's3:List*',
                                's3:PutObject*'
                            ],
                            Resource: cf.join([cf.getAtt('FilesBucket', 'Arn'), '/*']),
                            Condition: {
                                StringEquals: {
                                    'aws:ResourceAccount': cf.accountId
                                }
                            }
                        },{
                            Effect: 'Allow',
                            Action: [
                                'kms:GenerateDataKey',
                                'kms:Encrypt',
                                'kms:Decrypt',
                                'kms:ReEncryptFrom',
                                'kms:ReEncryptTo'
                            ],
                            Resource: cf.getAtt('KMS', 'Arn'),
                            Condition: {
                                StringLike: {
                                    'kms:ViaService': cf.join(['s3.', cf.region, '.amazonaws.com']),
                                    'kms:EncryptionContext:aws:s3:arn': [
                                        cf.getAtt('FilesBucket', 'Arn'),
                                        cf.join([cf.getAtt('FilesBucket', 'Arn'), '/*'])
                                    ]
                                }
                            }
                        },{
                            Effect: 'Allow',
                            Action: [
                                'events:DeleteRule',
                                'events:DisableRule',
                                'events:EnableRule',
                                'events:PutRule',
                                'events:PutTargets',
                                'events:RemoveTargets'
                            ],
                            Resource: cf.join(['arn:', cf.partition, ':events:*:*:rule/DO-NOT-DELETE-S3-Files*']),
                            Condition: {
                                StringEquals: {
                                    'events:ManagedBy': 'elasticfilesystem.amazonaws.com'
                                }
                            }
                        },{
                            Effect: 'Allow',
                            Action: [
                                'events:DescribeRule',
                                'events:ListRuleNamesByTarget',
                                'events:ListRules',
                                'events:ListTargetsByRule'
                            ],
                            Resource: cf.join(['arn:', cf.partition, ':events:*:*:rule/*'])
                        }]
                    }
                }]
            }
        },
        Files: {
            Type: 'AWS::S3Files::FileSystem',
            Properties: {
                Bucket: cf.getAtt('FilesBucket', 'Arn'),
                RoleArn: cf.getAtt('FilesRole', 'Arn'),
                KmsKeyId: cf.ref('KMS'),
                Tags: [{
                    Key: 'Name',
                    Value: cf.stackName
                }]
            }
        },
        FilesSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'files'])
                }],
                VpcId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc'])),
                GroupDescription: 'Allow NFS access from the TAK Server service to S3 Files mount targets',
                SecurityGroupIngress: [{
                    IpProtocol: 'tcp',
                    FromPort: 2049,
                    ToPort: 2049,
                    SourceSecurityGroupId: cf.ref('ServiceSecurityGroup')
                }]
            }
        },
        FilesMountTargetSubnetA: {
            Type: 'AWS::S3Files::MountTarget',
            Properties: {
                FileSystemId: cf.getAtt('Files', 'FileSystemId'),
                SubnetId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-public-a'])),
                SecurityGroups: [cf.ref('FilesSecurityGroup')]
            }
        },
        FilesMountTargetSubnetB: {
            Type: 'AWS::S3Files::MountTarget',
            Properties: {
                FileSystemId: cf.getAtt('Files', 'FileSystemId'),
                SubnetId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-public-b'])),
                SecurityGroups: [cf.ref('FilesSecurityGroup')]
            }
        },
        FilesAccessPointCerts: {
            Type: 'AWS::S3Files::AccessPoint',
            Properties: {
                FileSystemId: cf.getAtt('Files', 'FileSystemId'),
                PosixUser: {
                    Uid: '0',
                    Gid: '0'
                },
                RootDirectory: {
                    Path: '/certs',
                    CreationPermissions: {
                        OwnerUid: '0',
                        OwnerGid: '0',
                        Permissions: '0777'
                    }
                },
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'tak-certs-files'])
                }]
            }
        },
        FilesAccessPointLetsEncrypt: {
            Type: 'AWS::S3Files::AccessPoint',
            Properties: {
                FileSystemId: cf.getAtt('Files', 'FileSystemId'),
                PosixUser: {
                    Uid: '0',
                    Gid: '0'
                },
                RootDirectory: {
                    Path: '/letsencrypt',
                    CreationPermissions: {
                        OwnerUid: '0',
                        OwnerGid: '0',
                        Permissions: '0777'
                    }
                },
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'tak-letsencrypt'])
                }]
            }
        },
        FilesAccessPointCoreConfig: {
            Type: 'AWS::S3Files::AccessPoint',
            Properties: {
                FileSystemId: cf.getAtt('Files', 'FileSystemId'),
                PosixUser: {
                    Uid: '0',
                    Gid: '0'
                },
                RootDirectory: {
                    Path: '/config',
                    CreationPermissions: {
                        OwnerUid: '0',
                        OwnerGid: '0',
                        Permissions: '0777'
                    }
                },
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'tak-coreconfig'])
                }]
            }
        }
    },
    Outputs: {
        FilesBucket: {
            Description: 'S3 Bucket backing the TAK Server S3 Files file system',
            Export: {
                Name: cf.join([cf.stackName, '-files-bucket'])
            },
            Value: cf.ref('FilesBucket')
        },
        Files: {
            Description: 'S3 Files file system ARN for TAK Server persistent files',
            Export: {
                Name: cf.join([cf.stackName, '-files'])
            },
            Value: cf.ref('Files')
        },
        FilesCerts: {
            Description: 'S3 Files access point ARN - Certs',
            Export: {
                Name: cf.join([cf.stackName, '-files-ap-certs'])
            },
            Value: cf.getAtt('FilesAccessPointCerts', 'AccessPointArn')
        },
        FilesLetsEncrypt: {
            Description: 'S3 Files access point ARN - Lets Encrypt',
            Export: {
                Name: cf.join([cf.stackName, '-files-ap-letsencrypt'])
            },
            Value: cf.getAtt('FilesAccessPointLetsEncrypt', 'AccessPointArn')
        },
        FilesCoreConfig: {
            Description: 'S3 Files access point ARN - CoreConfig',
            Export: {
                Name: cf.join([cf.stackName, '-files-ap-coreconfig'])
            },
            Value: cf.getAtt('FilesAccessPointCoreConfig', 'AccessPointArn')
        }
    }
};
