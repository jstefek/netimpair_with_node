FROM selenium/node-chrome-debug:3.12.0

# run as root to be able to use netimpair commands
USER root

COPY add/netimpair_with_node /opt/netimpair_with_node

RUN apt-get -y update \
    `## install python ping and curl` \
    && apt-get -y install python iputils-ping curl \
    `## get node v10` \
    && curl --silent --location https://deb.nodesource.com/setup_10.x | bash - \
    `## install node` \
    && apt-get install -y nodejs \
    `## install dependencies of netimpair service` \
    && cd /opt/netimpair_with_node && npm install \
    `## cleanup` \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ENV PORT_HTTP=80 PORT_HTTPS=443 VNC_PASSWORD=secret

# expose netimpair service ports
EXPOSE $PORT_HTTP
EXPOSE $PORT_HTTPS

# entrypoint command
CMD `## setup vnc password` \
    mkdir -p ~/.vnc && x11vnc -storepasswd $VNC_PASSWORD ~/.vnc/passwd \
    `## run selenium node service (with starting up the vnc)` \
    && /opt/bin/entry_point.sh > /var/log/selenium.log \
    `## run netimpair service` \
    & cd /opt/netimpair_with_node && npm run start > /var/log/node.log