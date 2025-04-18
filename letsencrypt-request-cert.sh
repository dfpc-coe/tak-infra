#!/bin/bash

# If LetsEncrypt certs are present - check validity
if [ -d "/etc/letsencrypt/live/${HostedDomain}" ]; then
    # Extract the issuer from the certificate
    ISSUER=$(openssl x509 -noout -issuer -in "/etc/letsencrypt/live/${HostedDomain}/fullchain.pem")

    # Check if the issuer is from the Let's Encrypt staging environment
    if echo "$ISSUER" | grep -q "STAGING"; then
        if [ "${LetsencryptProdCert}" != "true" ]; then
            echo "ok - Test Cert"
        else
            echo "ok - Production Cert Requested - Test Cert Current - Regenerating"
            certbot delete --cert-name ${HostedDomain}
        fi
    else
        if [ "${LetsencryptProdCert}" != "true" ]; then
            echo "ok - Test Cert Requested - Prod Cert Current - Regenerating"
            certbot delete --cert-name ${HostedDomain}
        else
            echo "ok - Prod Cert"
        fi
    fi
fi

# If no LetsEncrypt certs are present - generate a set
if [ ! -d "/etc/letsencrypt/live/${HostedDomain}" ]; then
    echo "ok - No Certificates detected, requesting one"

    # Wait for port TCP/80 to be ready
    node /opt/tak/Ensure80.js

    CertbotParameter=""
    if [ "${LetsencryptProdCert}" != "true" ]; then
        CertbotParameter="--test-cert "
    fi

    Command="certbot certonly -v ${CertbotParameter}--standalone -d ${HostedDomain} --email ${HostedEmail} --non-interactive --agree-tos --cert-name ${HostedDomain} --deploy-hook /opt/tak/letsencrypt-deploy-hook-script.sh"

    while ! $Command; do
        echo "not ok - Command failed, retrying in 30 seconds..."
        sleep 30
        node /opt/tak/Ensure80.js
    done

    # Save Certbot Cronjob
    cp /etc/cron.d/certbot /etc/letsencrypt/certbot.cron

    # Force generation of new TAK certs from LetsEncrypt certs on new task deployment

    rm -rf "/opt/tak/certs/files/${HostedDomain}"

    echo "ok - New LetsEncrypt certs issued. Deploying new task."

    aws ecs update-service --cluster $ECS_Cluster_Name --service $ECS_Service_Name --force-new-deployment
fi
