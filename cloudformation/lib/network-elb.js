import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        SubdomainPrefix: {
            Description: 'Prefix of domain: ie "ops" of ops.example.com',
            Type: 'String',
            Default: 'ops'
        },
    },
    Resources: {
        ELBDNS: {
            Type: 'AWS::Route53::RecordSet',
            Properties: {
                HostedZoneId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-hosted-zone-id'])),
                Type : 'A',
                Name: cf.join([cf.ref('SubdomainPrefix'), '.', cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-hosted-zone-name']))]),
                Comment: cf.join(' ', [cf.stackName, 'UI/API DNS Entry']),
                AliasTarget: {
                    DNSName: cf.getAtt('ELB', 'DNSName'),
                    EvaluateTargetHealth: true,
                    HostedZoneId: cf.getAtt('ELB', 'CanonicalHostedZoneID')
                }
            }
        },
        ServiceSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'ecs-sg'])
                }],
                GroupDescription: 'Allow access to TAK ports',
                VpcId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc'])),
                SecurityGroupIngress: [{
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 8443,
                    ToPort: 8443
                },{
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80
                },{
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 8446,
                    ToPort: 8446
                },{
                    Description: 'ELB Traffic',
                    SourceSecurityGroupId: cf.ref('ELBSecurityGroup'),
                    IpProtocol: 'tcp',
                    FromPort: 8089,
                    ToPort: 8089
                }]
            }
        },
        Logs: {
            Type: 'AWS::Logs::LogGroup',
            Properties: {
                LogGroupName: cf.stackName,
                RetentionInDays: 7
            }
        },
        ELB: {
            Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
            Properties: {
                Name: cf.stackName,
                Type: 'network',
                IpAddressType: 'dualstack',
                SecurityGroups: [cf.ref('ELBSecurityGroup')],
                Subnets:  [
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-public-a'])),
                    cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-subnet-public-b']))
                ]
            }

        },
        ELBSecurityGroup: {
            Type : 'AWS::EC2::SecurityGroup',
            Properties : {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'elb-sg'])
                }],
                GroupDescription: 'Allow TAK Traffic into ELB',
                SecurityGroupIngress: [{
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443
                },{
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80
                },{
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 8443,
                    ToPort: 8443
                },{
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 8446,
                    ToPort: 8446
                },{
                    CidrIp: '0.0.0.0/0',
                    IpProtocol: 'tcp',
                    FromPort: 8089,
                    ToPort: 8089
                }],
                VpcId: cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-vpc']))
            }
        }
    },
    Outputs: {
        ServiceSG: {
            Description: 'TAK Service SG',
            Export: {
                Name: cf.join([cf.stackName, '-service-sg'])
            },
            Value: cf.ref('ServiceSecurityGroup')
        },
        Hosted: {
            Description: 'Hosted API Location',
            Export: {
                Name: cf.join([cf.stackName, '-hosted'])
            },
            Value: cf.join(['https://', cf.ref('SubdomainPrefix'), '.', cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-hosted-zone-name']))])
        },
        ELB: {
            Description: 'ELB ARN',
            Export: {
                Name: cf.join([cf.stackName, '-elb'])
            },
            Value: cf.ref('ELB')
        },
    }
};
