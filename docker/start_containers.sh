#!/usr/bin/env bash
# test script to startup hub and node docker containers to check functionality

usage () {
  echo "Usage:"
  echo " sh start_containers.sh [IMAGE_VERSION]"
  echo "Example:"
  echo " './start_containers.sh 3.14.0"
  exit 1
}

if [ -z "$1" ]; then
    usage
fi

VERSION=$1

# stop running containers
containers=( node1 hub )
for container in "${containers[@]}"; do
    docker stop $container
    docker rm $container
done
# remove docker network
docker network rm SE

# create docker network
docker network create SE

# start router, hub and node
docker run -d -p 4444:4444 --net=SE -v /dev/shm:/dev/shm --name hub selenium/hub:$VERSION
docker run -d --net=SE -e ROUTER=router -e HUB_PORT_4444_TCP_ADDR=hub -e HUB_PORT_4444_TCP_PORT=4444 -p 3333:3333 -p 3334:3334 -p 5911:5900 -e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1200 --cap-add=NET_ADMIN -v /dev/shm:/dev/shm --name node1 netimpair-with-node:${VERSION}

#sleep 10
#docker exec -u root node1 service netimpair_with_node start
