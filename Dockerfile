FROM eclipse-temurin:17-jammy
RUN apt update \
    && apt-get install -y cron emacs-nox net-tools vim certbot curl libxml2-utils unzip nodejs awscli

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
ENV NODE_VERSION=24
ENV TAK_VERSION=takserver-docker-5.5-RELEASE-53

RUN if [ ! -e "${TAK_VERSION}.zip" ]; then \
        wget "http://tak-server-releases.s3-website.us-gov-east-1.amazonaws.com/${TAK_VERSION}.zip"; \
    fi
RUN unzip "./${TAK_VERSION}.zip" \
    && rm "./${TAK_VERSION}.zip" \
    && rm -rf "./${TAK_VERSION}/docker" \
    && mv ./${TAK_VERSION}/tak/* ./ \
    && rm -rf "./${TAK_VERSION}"

RUN mkdir -p $NVM_DIR \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install \
    && npm install -g npm@11

ENTRYPOINT ["/bin/bash", "-c", "/opt/tak/start"]
