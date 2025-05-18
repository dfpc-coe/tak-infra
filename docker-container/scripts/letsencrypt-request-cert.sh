#!/bin/bash

# Check if TAKSERVER_QuickConnect_LetsEncrypt_Domain is specified and a Let's Encrypt cert is requested
if [[ -z "${TAKSERVER_QuickConnect_LetsEncrypt_Domain+x}" || \
    -z "${TAKSERVER_QuickConnect_LetsEncrypt_CertType+x}" || \
    ( "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" != "Production" && "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" != "Staging" ) \
    ]]; then
    echo "ok - TAK Server - Using self-signed certs instead of LetsEncrypt certs"
    cp /opt/tak/certs/files/takserver.jks /opt/tak/certs/files/nodomainset/letsencrypt.jks || true        
    exit 1
fi

# If LetsEncrypt certs are present - check validity
if [ -d "/etc/letsencrypt/live/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}" ]; then
    echo "ok - Certbot - Checking validity of existing certs"

    # Extract the issuer from the certificate
    ISSUER=$(openssl x509 -noout -issuer -in "/etc/letsencrypt/live/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}/fullchain.pem")

    # Check if the issuer is from the Let's Encrypt staging environment
    if echo "$ISSUER" | grep -q "STAGING"; then
        if [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" == "Staging" ]; then
            echo "ok - Certbot - Staging cert exists, Staging cert requested - Nothing to be done"
        elif [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" == "Production" ]; then
            echo "ok - Certbot - Staging cert exists, Production cert requested - Regenerating certs..."
            certbot delete --cert-name ${TAKSERVER_QuickConnect_LetsEncrypt_Domain} --non-interactive    
        else
            echo "ok - Certbot - Staging cert exists, No cert requested - Using self-signed certs..."
            cp /opt/tak/certs/files/takserver.jks /opt/tak/certs/files/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}/letsencrypt.jks || true
            aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
        fi
    elif echo "$ISSUER" | grep -q "Let's Encrypt"; then
        if [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" == "Production" ]; then
            echo "ok - Certbot - Production cert exists, Production cert requested - Nothing to be done"
        elif [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" == "Staging" ]; then
            echo "ok - Certbot - Production cert exists, Staging cert requested - Regenerating certs..."
            certbot delete --cert-name ${TAKSERVER_QuickConnect_LetsEncrypt_Domain} --non-interactive
        else 
            echo "ok - Certbot - Production cert exists, No cert requested - Using self-signed certs..."
            cp /opt/tak/certs/files/takserver.jks /opt/tak/certs/files/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}/letsencrypt.jks || true
            aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
        fi
    else
        if [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" == "Production" ]; then
            echo "ok - Certbot - No cert exists, Production cert requested - Regenerating certs..."
            certbot delete --cert-name ${TAKSERVER_QuickConnect_LetsEncrypt_Domain} --non-interactive || true
        elif [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" == "Staging" ]; then
            echo "ok - Certbot - No cert exists, Staging cert requested - Regenerating certs..."
            certbot delete --cert-name ${TAKSERVER_QuickConnect_LetsEncrypt_Domain} --non-interactive || true
        else
            echo "ok - Certbot - No cert exists, No cert requested - Using self-signed certs..."
            cp /opt/tak/certs/files/takserver.jks /opt/tak/certs/files/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}/letsencrypt.jks || true
            aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
        fi
    fi
fi

# If no LetsEncrypt certs are present - either because they never were or they were just removed - generate a set
if [ ! -d "/etc/letsencrypt/live/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}" ]; then
    echo "ok - Certbot - No existing certificates detected - Requesting new one"

    # Wait for port TCP/80 to be ready
    node /opt/tak/scripts/Ensure80.js

    CertbotParameter=""
    if [ "${TAKSERVER_QuickConnect_LetsEncrypt_CertType}" != "Production" ]; then
        CertbotParameter="--test-cert "
    fi

    Command="certbot certonly -v ${CertbotParameter}--standalone -d ${TAKSERVER_QuickConnect_LetsEncrypt_Domain} --email ${TAKSERVER_QuickConnect_LetsEncrypt_Email} --non-interactive --agree-tos --cert-name ${TAKSERVER_QuickConnect_LetsEncrypt_Domain} --deploy-hook /opt/tak/scripts/letsencrypt-deploy-hook-script.sh"

    while ! $Command; do
        echo "not ok - Certbot - Port TCP/80 not ready for HTTP-01 challenge - Retrying in 30 seconds..."
        sleep 30
        node /opt/tak/scripts/Ensure80.js
    done

    # Save Certbot Cronjob
    cp /etc/cron.d/certbot /etc/letsencrypt/certbot.cron

    # Force generation of new TAK certs from LetsEncrypt certs on new task deployment

    rm -rf "/opt/tak/certs/files/${TAKSERVER_QuickConnect_LetsEncrypt_Domain}"

    echo "ok - Certbot - New LetsEncrypt certs issued - Deploying new ECS task..."

    aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
fi
