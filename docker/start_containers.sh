#!/usr/bin/env bash
VERSION_SE=3.141.59-bismuth

# stop running containers
containers=( node1 hub router )
for container in "${containers[@]}"; do
    docker stop $container
    docker rm $container
done
# remove docker network
docker network rm SE

# create docker network
docker network create SE

# start router, hub and node
docker run -d --net=SE -p 3343:3333 -p 3344:3334 --cap-add=NET_ADMIN --name router router-with-node:0.5
docker run -d -p 4444:4444 --net=SE -v /dev/shm:/dev/shm --name hub selenium/hub:$VERSION_SE
docker run -d --net=SE -e ROUTER=router -e HUB_PORT_4444_TCP_ADDR=hub -e HUB_PORT_4444_TCP_PORT=4444 -p 3333:3333 -p 3334:3334 -p 5911:5900 -e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1200 --cap-add=NET_ADMIN -v /dev/shm:/dev/shm --name node1 netimpair-with-node:${VERSION_SE}
