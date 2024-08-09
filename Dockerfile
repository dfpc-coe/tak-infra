FROM eclipse-temurin:17-jammy
RUN apt update \
    && apt-get install -y emacs-nox net-tools netcat vim certbot

COPY start .
COPY Caddyfile .

ENTRYPOINT ["/bin/bash", "-c", "./start"]
