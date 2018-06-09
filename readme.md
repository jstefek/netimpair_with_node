## How to build
Run `docker/create_image.sh`, which will produce new docker image with all you need.

## How to use
#### Start docker hub
To run the node a hub needs to be linked and running, so start up the hub, e.g. with:

`docker run -d -p 4444:4444 -v /dev/shm:/dev/shm --name selenium-hub selenium/hub:3.12.0`

#### Start the node:
Once the hub is runnning, you can start the node, e.g. with:

`docker run -d -v /dev/shm:/dev/shm --name my-node -p 8080:80 -p 8081:443 -p 5911:5900 --cap-add=NET_ADMIN --link selenium-hub:hub netimpair-with-node:3.12.0`

(will start a node with name `my-node`,
 `http` port will be accessible on host's port 80,
 `https` port will be available on host's port 8081,
 `VNC` port will be on host's port 5911)

There are 3 ports, which CAN be mapped (http and https ports should not be necessary, probably use case is only for debugging):
* 5900 is default port for VNC
* 80 is default port for netimpair service on http
* 443 is default port for netimpair service on https

The option `cap-add=NET_ADMIN` is *mandatory*, without it, you cannot manage the network.

##### Changeable defaults
In case you need to change the default http or https ports, pass an environment variable(s) to run command for the node.
The variables are named `PORT_HTTP` and `PORT_HTTPS` (e.g. `docker run -e PORT_HTTP=1234 ...`).  

The default VNC password (`secret`) could also be changed, it is done by specifying environment variable `VNC_PASSWORD` (probably not the best way, if you know a more secure way, let me know or open PR).

#### Use in test
To use, just open the `localhost` address in your started browser using this node.

`browser.open 'localhost'` for http (using default port 80)

`browser.open 'https://localhost'` for https (using default port 443)

#### Warnings
The browser will run with root privileges.

Having opened VNC port (and user with root privileges) could also be a security risk.