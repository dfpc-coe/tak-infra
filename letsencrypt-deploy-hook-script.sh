#!/bin/bash

set -euo pipefail

if [[ -f /opt/tak/letsencrypt-env ]]; then
    . /opt/tak/letsencrypt-env
fi

for env in HostedDomain ECS_Cluster_Name ECS_Service_Name; do
    if [[ -z "${!env:-}" ]]; then
        echo "not ok - Certbot - ${env} not set. Exiting script."
        exit 1
    fi
done

/opt/tak/letsencrypt-to-jks.sh

aws ecs update-service --cluster "$ECS_Cluster_Name" --service "$ECS_Service_Name" --force-new-deployment > /dev/null
