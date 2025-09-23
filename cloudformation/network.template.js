import cf from '@openaddresses/cloudfriend';
import S3 from './lib/network-s3.js';
import DB from './lib/network-db.js';
import Alarms from './lib/network-alarms.js';
import KMS from './lib/network-kms.js';
import EFS from './lib/network-efs.js';
import ELB from './lib/network-elb.js';
import {
   RDS as RDSAlarms
} from '@openaddresses/batch-alarms';

export default cf.merge(
    DB, KMS, Alarms, EFS, ELB, S3,
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
    },
    RDSAlarms({
       prefix: 'Batch',
       topic: cf.ref('AlarmTopic'),
       cluster: cf.ref('DBCluster')
    })
);
