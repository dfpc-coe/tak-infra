import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        AlarmTopic: {
            Type: 'AWS::SNS::Topic',
            Properties: {
                DisplayName: cf.join([cf.stackName, '-alarms']),
                TopicName: cf.join([cf.stackName, '-alarms'])
            }
        }
    }
};
