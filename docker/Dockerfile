FROM selenium/node-chrome-debug:3.12.0

# run as root to be able to use netimpair commands
USER root

RUN apt-get -y update \
    `## install python ping, ifconfig and curl` \
    && apt-get -y install python iputils-ping net-tools kmod curl \
    `## get node` \
    && curl --silent --location https://deb.nodesource.com/setup_10.x | bash - \
    `## install node` \
    && apt-get install -y nodejs \
    `## cleanup` \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ENV PORT_VNC=5900 PORT_HTTP=80 PORT_HTTPS=443 VNC_PASSWORD=secret SET_CONTAINER_TIMEZONE=false CONTAINER_TIMEZONE=UTC

# expose netimpair service ports
EXPOSE $PORT_HTTP
EXPOSE $PORT_HTTPS

COPY add/netimpair_with_node /opt/netimpair_with_node

# install dependencies of netimpair service
RUN cd /opt/netimpair_with_node && npm install

# entrypoint command
CMD `## setup vnc password` \
    mkdir -p ~/.vnc && x11vnc -storepasswd $VNC_PASSWORD ~/.vnc/passwd \
    `## setup timezone` \
    && /opt/netimpair_with_node/setTZ.sh > /var/log/tz.log \
    `## run selenium node service (with starting up the vnc)` \
    & /opt/bin/entry_point.sh > /var/log/selenium.log \
    `## run netimpair service` \
    & cd /opt/netimpair_with_node && npm run start > /var/log/node.log