#!/bin/bash
#
# Convert the LetsEncrypt cert for HostedDomain into the keystore used by the TAK Server connectors
#

set -euo pipefail

LIVE="/etc/letsencrypt/live/${HostedDomain}"
DEST="/opt/tak/certs/files/${HostedDomain}"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

mkdir -p "${DEST}"

openssl pkcs12 \
    -export \
    -in "${LIVE}/fullchain.pem" \
    -inkey "${LIVE}/privkey.pem" \
    -out "${TMP}/letsencrypt.p12" \
    -name "${HostedDomain}" \
    -password "pass:atakatak"

keytool \
    -importkeystore \
    -srcstorepass "atakatak" \
    -deststorepass "atakatak" \
    -destkeystore "${TMP}/letsencrypt.jks" \
    -srckeystore "${TMP}/letsencrypt.p12" \
    -srcstoretype "pkcs12"

cp "${TMP}/letsencrypt.p12" "${DEST}/letsencrypt.p12"
cp "${TMP}/letsencrypt.jks" "${DEST}/letsencrypt.jks.tmp"
mv "${DEST}/letsencrypt.jks.tmp" "${DEST}/letsencrypt.jks"
