FROM eclipse-temurin:17-jammy
RUN apt update \
    && apt-get install -y emacs-nox net-tools netcat vim certbot curl libxml2-utils unzip

ENV HOME=/home/server
WORKDIR $HOME

COPY ./ $HOME/

EXPOSE 80
EXPOSE 443
EXPOSE 8443
EXPOSE 8444
EXPOSE 8446


ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=22
ENV TAK_VERSION=takserver-docker-5.2-RELEASE-43

RUN curl -o- https://www.amazontrust.com/repository/AmazonRootCA1.pem > /tmp/AmazonRootCA1.pem \
    && openssl pkcs12 -export -nokeys -in /tmp/AmazonRootCA1.pem -out /tmp/intermediate.p12  -password pass:INTENTIONALLY_NOT_SENSITIVE \
    && keytool -importkeystore -srckeystore /tmp/intermediate.p12 -srcstoretype PKCS12 -destkeystore ./aws-acm-root.jks -deststoretype JKS \
    && rm /tmp/*.pem \
    && rm /tmp/*.p12

RUN wget "http://tak-server-releases.s3-website.us-gov-east-1.amazonaws.com/${TAK_VERSION}.zip" \
    && unzip "./${TAK_VERSION}.zip" \
    && rm "./${TAK_VERSION}.zip" \
    && rm -rf "./${TAK_VERSION}/docker" \
    && mv ./${TAK_VERSION}/tak/* ./ \
    && rm -rf "./${TAK_VERSION}"

RUN mkdir -p $NVM_DIR \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install \
    && npm install --global http-server

ENTRYPOINT ["/bin/bash", "-c", "./start"]
