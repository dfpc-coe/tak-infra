FROM eclipse-temurin:17-jammy
RUN apt update \
    && apt-get install -y emacs-nox net-tools netcat vim certbot

COPY start .
COPY Caddyfile .

EXPOSE 80
EXPOSE 443
EXPOSE 8443
EXPOSE 8444
EXPOSE 8446

ENTRYPOINT ["/bin/bash", "-c", "./start"]
