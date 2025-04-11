import cf from '@openaddresses/cloudfriend';
import API from './lib/api.js';
import KMS from './lib/kms.js';

export default cf.merge(
    API,
    {
        Description: 'Template for @tak-ps/tak-infra',
        Parameters: {
            GitSha: {
                Description: 'GitSha that is currently being deployed',
                Type: 'String'
            },
            Environment: {
                Description: 'VPC/ECS Stack to deploy into',
                Type: 'String',
                Default: 'prod'
            }
        }
    }
//    RDSAlarms({
//       prefix: 'Batch',
//       topic: cf.ref('AlarmTopic'),
//       instance: cf.ref('DBInstance')
//    })
);
