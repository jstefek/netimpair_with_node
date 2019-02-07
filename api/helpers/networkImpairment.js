const IP_REGEX = /^\d+\.\d+\.\d+\.\d+$/,
    PORT_REGEX = /^\d+$/,
    SPEC_REGEX = /^(src|dst|sport|dport)=/,

    EXCLUDED_PORTS = [
        process.env.PORT_HTTPS || 3334,
        process.env.PORT_HTTP || 3333,
        process.env.PORT_VNC || 5900,
        process.env.HUB_PORT_4444_TCP_PORT || 4444,
        process.env.NODE_PORT || 5555
    ],

    {spawn, exec} = require('child_process'),
    executable = __dirname + '/netimpair.py',
    cmdQueueLengthSize = 'ip link set eth0 qlen ';


/**
 * Sets qdisc queue length.
 * @param size size of the queue
 */
function setQueueLength(size) {
    console.log(`setting queue length to ${size}`);
    exec(cmdQueueLengthSize + size, (error, stdout, stderr) => {
        if (error) {
            console.log(`exec error when setting queue length: ${error}`);
        }
    });
}

/**
 * Parses a string into array.
 * @return an array, either empty or with parsed values
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

class NetworkImpairment {

    constructor(query) {
        this.active = false;
        this.query = query;
    }

    buildCommandParams() {
        const isDownlink = this.query.direction === 'downlink';
        let excluded, included, type, command;

        excluded = parseArray(this.query.excluded).concat(EXCLUDED_PORTS);

        included = parseArray(this.query.included);
        type = this.query.type;

        command = [];
        command.push('-n ' + this.query.networkInterface);

        if (included.length === 0) {
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

        if (isDownlink) {
            command.push('--inbound');
        }

        command.push((type === 'limit' ? 'rate' : 'netem') + ' --' + type + ' ' + this.query.value);
        command.push('--toggle ' + this.query.duration);

        return command.join(' ');
    }

    isActive() {
        return this.active;
    }

    activate() {
        let context = this;
        return new Promise(function (resolve, reject) {
            if (context.active) {
                let msg = 'impairment is already active';
                console.log(msg);
                resolve(msg);
            } else {
                console.log('Activating impairment');
                context.active = true;
                setQueueLength(1000);

                let throttleUplink = function () {
                    let command = 'python ' + executable + ' ' + context.buildCommandParams(context.query);
                    console.log(`executing command: ${command}`);
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
                        setQueueLength(0);
                        context.active = false;
                    });
                };

                if (context.query.direction === 'downlink') {
                    let msg = 'downlink throttling is not supported';
                    console.log(msg);
                    context.active = false;
                    reject(msg);
                } else {
                    throttleUplink();
                }
            }
        });
    }

    deactivate() {
        let context = this;
        return new Promise(function (resolve, reject) {
            if (context.active) {
                console.log('stopping netimpair process');
                // kill the process
                exec(`pkill python`);
                resolve();
                context.netimpairProcess = undefined;
            }
            context.active = false;
        });
    }
}

exports.NetworkImpairment = NetworkImpairment;
