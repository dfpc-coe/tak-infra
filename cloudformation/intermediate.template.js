import cf from '@openaddresses/cloudfriend';

export default {
    Description: 'Intermediate networking resources for staging a public RDS in the tak-infra VPC prior to migration',
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
        DBPort: {
            Description: 'Database port exposed for the intermediate RDS',
            Type: 'Number',
            Default: 5432
        },
        AllowedIngressCidr: {
            Description: 'CIDR block permitted to reach the intermediate RDS (use sparingly; internet-wide by default)',
            Type: 'String',
            Default: '0.0.0.0/0'
        }
    },
    Resources: {
        IntermediateDBSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                GroupDescription: 'Publicly reachable security group for intermediate RDS migration source',
                GroupName: cf.join('-', [cf.stackName, 'intermediate-db-sg']),
                VpcId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc'])),
                SecurityGroupIngress: [{
                    IpProtocol: 'TCP',
                    FromPort: cf.ref('DBPort'),
                    ToPort: cf.ref('DBPort'),
                    CidrIp: cf.ref('AllowedIngressCidr'),
                    Description: 'Ingress for migration source database'
                }],
                SecurityGroupEgress: [{
                    IpProtocol: '-1',
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow outbound for admin and migration tooling'
                }],
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'intermediate-db-sg'])
                }]
            }
        },
        IntermediateDBSubnetGroup: {
            Type: 'AWS::RDS::DBSubnetGroup',
            Properties: {
                DBSubnetGroupDescription: 'Public subnets for staging an internet-reachable intermediate RDS',
                DBSubnetGroupName: cf.join('-', [cf.stackName, 'intermediate-db-subnets']),
                SubnetIds: [
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-public-a'])),
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-public-b']))
                ]
            }
        }
    },
    Outputs: {
        IntermediateDBSecurityGroupId: {
            Description: 'Security Group ID for the intermediate RDS',
            Value: cf.ref('IntermediateDBSecurityGroup'),
            Export: {
                Name: cf.join([cf.stackName, '-intermediate-db-sg'])
            }
        },
        IntermediateDBSubnetGroupName: {
            Description: 'Subnet group name for the intermediate RDS',
            Value: cf.ref('IntermediateDBSubnetGroup'),
            Export: {
                Name: cf.join([cf.stackName, '-intermediate-db-subnet-group'])
            }
        }
    }
};
