FROM eclipse-temurin:17-jammy
RUN apt update && \
    apt-get install -y emacs-nox net-tools netcat vim

ENTRYPOINT ["/bin/bash", "-c", "/opt/tak/configureInDocker.sh init &>> /opt/tak/logs/takserver.log"]
