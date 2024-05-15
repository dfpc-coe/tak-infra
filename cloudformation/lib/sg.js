import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        ServiceSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'ec2-sg'])
                }],
                GroupName: cf.join('-', [cf.stackName, 'ec2-sg']),
                GroupDescription: 'EC2s in this SG have access to the Database',
                VpcId: cf.importValue(cf.join(['coe-vpc-', cf.ref('Environment'), '-vpc'])),
                SecurityGroupIngress: []
            }
        }
    }
};
