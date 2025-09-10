import cf from '@openaddresses/cloudfriend';
import DB from './lib/db.js';
import EFS from './lib/efs.js';
import ELB from './lib/elb.js';

export default cf.merge(
    DB,
    EFS,
    ELB,
    {
        Description: 'TAK Server Layer - Base',
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
            EnvType: {
                Description: 'Environment type',
                Type: 'String',
                AllowedValues: ['prod', 'dev-test'],
                Default: 'prod'
            }
        }
    }
);
