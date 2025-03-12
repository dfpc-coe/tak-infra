FROM eclipse-temurin:17-jammy
RUN apt update \
    && apt-get install -y emacs-nox net-tools netcat vim certbot curl libxml2-utils unzip nodejs awscli

ENV HOME=/opt/tak
WORKDIR $HOME

COPY ./ $HOME/

EXPOSE 80
EXPOSE 443
EXPOSE 8443
EXPOSE 8446
EXPOSE 9000
EXPOSE 9001


ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=22
ENV TAK_VERSION=takserver-docker-5.3-RELEASE-24

RUN [ -e "./${TAK_VERSION}.zip" ] \
    && unzip "./${TAK_VERSION}.zip" \
    && rm "./${TAK_VERSION}.zip" \
    && rm -rf "./${TAK_VERSION}/docker" \
    && mv ./${TAK_VERSION}/tak/* ./ \
    && rm -rf "./${TAK_VERSION}"

RUN mkdir -p /opt/tak/certs/files/ \
    && curl -o- https://www.amazontrust.com/repository/AmazonRootCA1.pem > /tmp/AmazonRootCA1.pem \
    && yes | keytool -import -file /tmp/AmazonRootCA1.pem -alias AWS -deststoretype JKS -deststorepass INTENTIONALLY_NOT_SENSITIVE -keystore /opt/tak/aws-acm-root.jks \
    && rm /tmp/*.pem

RUN mkdir -p $NVM_DIR \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install \
    && npm install --global http-server

ENTRYPOINT ["/bin/bash", "-c", "/opt/tak/start"]
