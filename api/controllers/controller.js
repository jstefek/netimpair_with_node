'use strict';
const {spawn, exec} = require('child_process');
const networkInterfacesJson = require('os').networkInterfaces();
const request = require('request');
const ip = require("ip").address();
console.log(`local ip: ${ip}`);

var networkInterfaces = [];
for (var i in networkInterfacesJson) {
    networkInterfaces.push(i);
}

var executable = __dirname + '/netimpair.py',
    active = false,
    PORT_HTTPS = process.env.PORT_HTTPS || 443,
    PORT_HTTP = process.env.PORT_HTTP || 80,
    PORT_VNC = process.env.PORT_VNC || 5900,
    PORT_SELENIUM_HUB = process.env.HUB_PORT_4444_TCP_PORT || 4444,
    PORT_SELENIUM_NODE = process.env.NODE_PORT || 5555,
    ROUTER = process.env.ROUTER,
    ROUTER_ADDRESS = 'http://' + ROUTER + ':3333/netimpair',
    IP_REGEX = /^\d+\.\d+\.\d+\.\d+$/,
    PORT_REGEX = /^\d+$/,
    SPEC_REGEX = /^(src|dst|sport|dport)=/,
    impairment, routing = false, defaultIP;


function setQueueLength(size) {
    console.log(`setting queue length to ${size}`);
    let cmdQueueSize = 'ip link set eth0 qlen ' + size;
    exec(cmdQueueSize, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error when setting queue length: ${error}`);
        }
    });
}

class NetworkImpairment {
    constructor(query) {
        this.active = false;
        this.query = query;
        this.isExternalThrottle = false;
    }

    isActive() {
        return this.active;
    }

    activate() {
        let context = this;
        return new Promise(function (resolve, reject) {
            if (context.active) {
                console.log('Impairment is already active');
                resolve();
            } else {
                console.log('Activating impairment');
                context.active = true;
                setQueueLength(1000);

                let throttleExternally = function () {
                    // clear the active state after timeout
                    context.timeout = setTimeout(function () {
                        context.active = false;
                        // setQueueLength(0);
                    }, parseInt(context.query.duration) * 1000 + 1000);

                    // add local ip
                    if (!!context.query.included) {
                        context.query.included += `, dst=${ip}`;
                    } else {
                        context.query.included = `dst=${ip}`;
                    }

                    // send the throttle request
                    let addr = ROUTER_ADDRESS + '/activate?' + context.createQueryString();
                    console.log('sending request ' + addr);
                    request(addr, function (error, response, body) {
                        if (error) {
                            context.active = false;
                            // setQueueLength(0);
                            reject(`error when sending request to activate throttling: ${error}`);
                            return;
                        }
                        resolve();
                    });
                };

                let throttleLocally = function () {

                    let command = 'python ' + executable + ' ' + buildCommandParams(context.query);
                    console.log(command);
                    context.netimpairProcess = spawn(command, {shell: true});
                    resolve();
                    context.netimpairProcess.stdout.on('data', function (data) {
                        console.log(`out: ${data}`);
                    });
                    context.netimpairProcess.stderr.on('data', function (data) {
                        console.log(`err: ${data}`);
                    });
                    context.netimpairProcess.on('close', function (code, signal) {
                        console.log(`close, ${code}, ${signal}`);
                        // setQueueLength(0);
                        context.active = false;
                    });
                };

                if (context.query.direction === 'downlink') {
                    context.isExternalThrottle = true;
                    context.query.direction = 'uplink';
                    startRoutingPackets().then(throttleExternally);
                } else {
                    context.isExternalThrottle = false;
                    throttleLocally();
                }
            }
        });
    }

    deactivate() {
        let context = this;
        return new Promise(function (resolve, reject) {
            if (context.active) {
                if (context.isExternalThrottle) {
                    let addr = ROUTER_ADDRESS + '/deactivate';
                    console.log('sending request ' + addr);
                    request(addr, function (error, response, body) {
                        if (error) {
                            reject(`error when sending request to deactivate throttling: ${error}`);
                            return;
                        }
                        resolve();
                    });
                } else {
                    console.log('killing');
                    context.netimpairProcess.kill('SIGTERM');
                    exec(`pkill python`);
                    resolve();
                    context.netimpairProcess = undefined;
                }
            }
            context.active = false;
        });
    }

    createQueryString() {
        return Object.keys(this.query)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(this.query[k]))
            .join('&');
    }
}

function startRoutingPackets() {
    return new Promise(function (resolve, reject) {
        if (routing) {
            console.log('routing of packets already enabled');
            resolve();
        } else {
            console.log('starting routing of packets');
            routing = true;
            let start_routing = function () {
                let cmd = 'ip route del default && ip route add default via `dig +short $ROUTER`';
                console.log(cmd);
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        reject(`exec error when setting ip route: ${error}`);
                        routing = false;
                        return;
                    }
                    resolve();
                });
            };

            if (!defaultIP) {
                exec('ip route', (error, stdout, stderr) => {
                    if (error) {
                        reject(`exec error when getting default gateway ip: ${error}`);
                        return;
                    }
                    let index = stdout.indexOf('default via ') + 12;
                    defaultIP = stdout.substring(index, stdout.indexOf(' ', index));
                    console.log(`defaultIP: ${defaultIP}`);
                    start_routing();
                });
            } else {
                start_routing();
            }
        }
    });
}

function stopRoutingPackets() {
    return new Promise(function (resolve, reject) {
        if (routing) {
            routing = false;
            console.log('stop routing of packets');
            let cmd = 'ip route del default && ip route add default via ' + defaultIP;
            console.log(cmd);
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(`exec error when setting default ip route: ${error}`);
                    return;
                }
                resolve();
            });
        } else {
            console.log('not routing packets');
            resolve();
        }
    });
}


/**
 * Returns an array, either empty or with parsed values
 */
function parseArray(str) {
    let result;
    if (!str) {
        result = [];
    } else {
        result = str.split(',').map(function (value) {
            // trim
            return value.replace(/^\s+|\s+$/g, '');
        }).filter(function (value) {
            return !!value;
        });
    }
    return result;
}

function buildCommandParams(query) {
    let excluded = parseArray(query.excluded);

    excluded.push(PORT_SELENIUM_HUB);
    excluded.push(PORT_SELENIUM_NODE);
    excluded.push(PORT_HTTP);
    excluded.push(PORT_HTTPS);
    excluded.push(PORT_VNC);

    let included = parseArray(query.included);
    let type = query.type;

    let command = [];
    command.push('-n ' + query.networkInterface);

    if (included.length == 0) {
        // exclude all given addresses
        excluded.forEach(function (val) {
            if (SPEC_REGEX.test(val)) {
                command.push('--exclude ' + val);
            } else {
                if (IP_REGEX.test(val)) {
                    command.push('--exclude src=' + val);
                    command.push('--exclude dst=' + val);
                } else if (PORT_REGEX.test(val)) {
                    command.push('--exclude sport=' + val);
                    command.push('--exclude dport=' + val);
                } else {
                    throw 'UNKNOWN value to exclude: <' + val + '>';
                }
            }
        });
    }

    included.forEach(function (val) {
        if (SPEC_REGEX.test(val)) {
            command.push('--include ' + val);
        } else {
            if (IP_REGEX.test(val)) {
                command.push('--include src=' + val);
                command.push('--include dst=' + val);
            } else if (PORT_REGEX.test(val)) {
                command.push('--include sport=' + val);
                command.push('--include dport=' + val);
            } else {
                throw 'UNKNOWN value to include: <' + val + '>';
            }
        }
    });
    command.push((type === 'limit' ? 'rate ' : 'netem') + ' --' + type + ' ' + query.value);
    command.push('--toggle ' + query.duration);
    return command.join(' ');
}

exports.isActive = function (req, res) {
    res.status(200).send(!!impairment && impairment.isActive());
};
exports.isRouting = function (req, res) {
    res.status(200).send(!!routing);
};

exports.activate = function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('activating ' + req.query);
    if (!!impairment && impairment.isActive()) {
        res.status(400).send('already active');
    } else {
        impairment = new NetworkImpairment(req.query);
        impairment.activate().then(function () {
            res.status(200).send('command executed');
        }).catch(function (err) {
            console.error(err)
        });
    }
};

exports.deactivate = function (req, res) {
    if (!!impairment && impairment.isActive()) {
        impairment.deactivate().then(function () {
            res.status(200).send('deactivated');
        }).catch(function (err) {
            console.error(err);
            res.status(500).send('problem with deactivation');
        });
    } else {
        console.log('already deactivated');
        res.status(200).send('already deactivated')
    }
    active = false;
};

exports.stopRouting = function (req, res) {
    if (!routing) {
        res.status(200).send('already stopped');
    } else {
        stopRoutingPackets().then(function () {
            res.status(200).send('stopped');
        }).catch(function (err) {
            console.error(err)
        });
    }
};

exports.startRouting = function (req, res) {
    if (!routing) {
        startRoutingPackets().then(function () {
            res.status(200).send('started');
        }).catch(function (err) {
            console.error(err)
        });
    } else {
        res.status(200).send('already routing');
    }
};

exports.networkInterfaces = function (req, res) {
    res.status(200).send(networkInterfaces);
};
