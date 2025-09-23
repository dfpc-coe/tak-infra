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
        },
        Resources: {
            ApplicationAssociation: {
                Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
                Properties: {
                    Application: cf.join(['arn:', cf.partition, ':servicecatalog:', cf.region, ':', cf.accountId, ':/applications/', cf.importValue(cf.join(['tak-vpc-', cf.ref('Environment'), '-application']))]),
                    Resource: cf.stackId,
                    ResourceType: 'CFN_STACK'
                }
            }
        }
    }
);
