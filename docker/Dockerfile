FROM selenium/node-chrome-debug:3.7.1

# run as root to use netimpair commands
USER root

# install python, ping, curl, nodejs
RUN apt-get -y update && apt-get -y install python iputils-ping curl \
    && curl --silent --location https://deb.nodesource.com/setup_8.x | bash -  \
    && apt-get install -y nodejs

COPY add/netimpair_with_node /tmp/netimpair_with_node

RUN cd /tmp/netimpair_with_node && npm install

EXPOSE 3333
CMD /opt/bin/entry_point.sh & cd /tmp/netimpair_with_node && npm run start > /tmp/node.log