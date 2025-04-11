import cf from '@openaddresses/cloudfriend';
import DB from './lib/db.js';
import Alarms from './lib/alarms.js';
import KMS from './lib/kms.js';
import EFS from './lib/efs.js';

// import {
//    RDS as RDSAlarms
// } from '@openaddresses/batch-alarms';

export default cf.merge(
    DB, KMS, Alarms, EFS,
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
