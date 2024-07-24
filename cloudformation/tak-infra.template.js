import cf from '@openaddresses/cloudfriend';
import RDS from './lib/db.js';
import API from './lib/api.js';
import Alarms from './lib/alarms.js';
import KMS from './lib/kms.js';
import {
    RDS as RDSAlarms
} from '@openaddresses/batch-alarms';

export default cf.merge(
    API, RDS, KMS, Alarms,
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
    },
    RDSAlarms({
        prefix: 'Batch',
        topic: cf.ref('AlarmTopic'),
        instance: cf.ref('DBInstance')
    }),
);
