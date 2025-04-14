import cf from '@openaddresses/cloudfriend';
import Service from './lib/service.js';

export default cf.merge(
    Service,
    {
        Description: 'ECS Service for @tak-ps/tak-infra',
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
);
