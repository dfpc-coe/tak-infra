import cf from '@openaddresses/cloudfriend';
import DB from './lib/db.js';
import Alarms from './lib/alarms.js';
import KMS from './lib/kms.js';
import EFS from './lib/efs.js';
import ELB from './lib/elb.js';

// import {
//    RDS as RDSAlarms
// } from '@openaddresses/batch-alarms';

export default cf.merge(
    DB, KMS, Alarms, EFS, ELB,
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
            },
            HighAvailability: {
                Description: 'High Availability Mode',
                Default: 'false',
                Type: 'String',
                AllowedValues: ['true', 'false']
            }
        },
        Conditions: {
            CreateProdResources: cf.equals(cf.ref('HighAvailability'), 'true')
        },
    }
//    RDSAlarms({
//       prefix: 'Batch',
//       topic: cf.ref('AlarmTopic'),
//       instance: cf.ref('DBInstance')
//    })
);
