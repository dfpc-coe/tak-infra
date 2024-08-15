FROM eclipse-temurin:17-jammy
RUN apt update \
    && apt-get install -y emacs-nox net-tools netcat vim certbot curl

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

RUN mkdir -p $NVM_DIR \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install \
    && npm install --global http-server

ENTRYPOINT ["/bin/bash", "-c", "./start"]
