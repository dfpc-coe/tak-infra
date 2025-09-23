#!/bin/bash

if [[ -z "$ECS_Cluster_Name" ]]; then  
  echo "ECS_Cluster_Name not set. Exiting script."  
  exit 1  
fi

if [[ -z "$ECS_Service_Name" ]]; then  
  echo "ECS_Service_Name not set. Exiting script."  
  exit 1  
fi

aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
