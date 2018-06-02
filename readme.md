## how to run
start docker hub with name 'selenium-hub' and then run:
`docker run -d -v /dev/shm:/dev/shm --name node-mine -p 3333:3333 -p 5900:5900 --cap-add=NET_ADMIN --link selenium-hub:hub netimpair-with-node`