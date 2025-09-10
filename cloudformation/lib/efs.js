import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        EFSFileSystem: {
            Type: 'AWS::EFS::FileSystem',
            Properties: {
                FileSystemTags: [{
                    Key: 'Name',
                    Value: cf.stackName
                }],
                Encrypted: true,
                KmsKeyId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-kms'])),
                PerformanceMode: 'generalPurpose',
                ThroughputMode: 'bursting',
                BackupPolicy: {
                    Status: 'DISABLED'
                }
            }
        },
        EFSSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'efs-sg'])
                }],
                GroupName: cf.join('-', [cf.stackName, 'efs-sg']),
                GroupDescription: 'EFS to TAK ECS Service',
                SecurityGroupIngress: [{
                    IpProtocol: 'tcp',
                    FromPort: 2049,
                    ToPort: 2049,
                    CidrIp: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-vpc-cidr-ipv4']))
                }],
                VpcId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-vpc-id']))
            }
        },
        EFSAccessPointTAK: {
            Type: 'AWS::EFS::AccessPoint',
            Properties: {
                AccessPointTags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'tak-certs-files'])
                }],
                FileSystemId: cf.ref('EFSFileSystem'),
                PosixUser: {
                    Uid: 0,
                    Gid: 0
                },
                RootDirectory: {
                    CreationInfo: {
                        OwnerGid: 0,
                        OwnerUid: 0,
                        Permissions: '0777'
                    },
                    Path: '/opt/tak/certs/files'
                }
            }
        },
        EFSAccessPointLetsEncrypt: {
            Type: 'AWS::EFS::AccessPoint',
            Properties: {
                AccessPointTags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'tak-letsencrypt'])
                }],
                FileSystemId: cf.ref('EFSFileSystem'),
                PosixUser: {
                    Uid: 0,
                    Gid: 0
                },
                RootDirectory: {
                    CreationInfo: {
                        OwnerGid: 0,
                        OwnerUid: 0,
                        Permissions: '0777'
                    },
                    Path: '/etc/letsencrypt'
                }
            }
        },
        EFSMountTargetSubnetA: {
            Type: 'AWS::EFS::MountTarget',
            Properties: {
                FileSystemId: cf.ref('EFSFileSystem'),
                SubnetId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-subnet-public-a'])),
                SecurityGroups: [cf.ref('EFSSecurityGroup')]
            }
        },
        EFSMountTargetSubnetB: {
            Type: 'AWS::EFS::MountTarget',
            Properties: {
                FileSystemId: cf.ref('EFSFileSystem'),
                SubnetId: cf.importValue(cf.join(['coe-base-', cf.ref('Environment'), '-subnet-public-b'])),
                SecurityGroups: [cf.ref('EFSSecurityGroup')]
            }
        }
    },
    Outputs: {
        EFS: {
            Description: 'EFS for TAK Server Config',
            Export: {
                Name: cf.join([cf.stackName, '-efs'])
            },
            Value: cf.ref('EFSFileSystem')
        },
        EFSLetsEncrypt: {
            Description: 'EFS for TAK Server Config - Lets Encrypt AP',
            Export: {
                Name: cf.join([cf.stackName, '-efs-ap-letsencrypt'])
            },
            Value: cf.ref('EFSAccessPointLetsEncrypt')
        },
        EFSCerts: {
            Description: 'EFS for TAK Server Config - Certs AP',
            Export: {
                Name: cf.join([cf.stackName, '-efs-ap-certs'])
            },
            Value: cf.ref('EFSAccessPointTAK')
        }
    }
};
