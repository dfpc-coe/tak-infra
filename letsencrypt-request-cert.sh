#!/bin/bash

# If LetsEncrypt certs are present - check validity
if [ -d "/etc/letsencrypt/live/${HostedDomain}" ]; then
    echo "ok - Certbot - Checking validity of existing certs"

    # Extract the issuer from the certificate
    ISSUER=$(openssl x509 -noout -issuer -in "/etc/letsencrypt/live/${HostedDomain}/fullchain.pem")

    # Check if the issuer is from the Let's Encrypt staging environment
    if echo "$ISSUER" | grep -q "STAGING"; then
        if [ "${LetsencryptProdCert}" != "true" ]; then
            echo "ok - Certbot - Staging cert exists"
        else
            echo "ok - Certbot - Staging cert exists, Production cert requested - Regenerating certs..."
            certbot delete --cert-name ${HostedDomain} --non-interactive
        fi
    else
        if [ "${LetsencryptProdCert}" != "true" ]; then
            echo "ok - Certbot - Production cert exists, Staging cert requested - Regenerating certs..."
            certbot delete --cert-name ${HostedDomain} --non-interactive
        else
            echo "ok - Certbot - Production cert exists"
        fi
    fi
fi

# If no LetsEncrypt certs are present - generate a set
if [ ! -d "/etc/letsencrypt/live/${HostedDomain}" ]; then
    echo "ok - Certbot - No existing certificates detected - Requesting new one"

    # Wait for port TCP/80 to be ready
    node /opt/tak/Ensure80.js

    CertbotParameter=""
    if [ "${LetsencryptProdCert}" != "true" ]; then
        CertbotParameter="--test-cert "
    fi

    Command="certbot certonly -v ${CertbotParameter}--standalone -d ${HostedDomain} --email ${HostedEmail} --non-interactive --agree-tos --cert-name ${HostedDomain} --deploy-hook /opt/tak/letsencrypt-deploy-hook-script.sh"

    while ! $Command; do
        echo "not ok - Certbot - Port TCP/80 not ready for HTTP-01 challenge - Retrying in 30 seconds..."
        sleep 30
        node /opt/tak/Ensure80.js
    done

    # Save Certbot Cronjob
    cp /etc/cron.d/certbot /etc/letsencrypt/certbot.cron

    # Force generation of new TAK certs from LetsEncrypt certs on new task deployment

    rm -rf "/opt/tak/certs/files/${HostedDomain}"

    echo "ok - Certbot - New LetsEncrypt certs issued - Deploying new ECS task..."

    aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
fi
