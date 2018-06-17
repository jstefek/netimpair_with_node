'use strict';
var exec = require('child_process').exec,
    executable = __dirname + '/netimpair.py',
    active = false,
    PORT_HTTPS = process.env.PORT_HTTPS || 443,
    PORT_HTTP = process.env.PORT_HTTP || 80,
    PORT_VNC = process.env.PORT_VNC || 5900,
    PORT_SELENIUM_HUB = process.env.HUB_PORT_4444_TCP_PORT || 4444,
    PORT_SELENIUM_NODE = process.env.NODE_PORT || 5555,
    IP_REGEX = /^\d+\.\d+\.\d+\.\d+$/,
    PORT_REGEX = /^\d+$/,
    SPEC_REGEX = /^(src|dst|sport|dport)=/,
    netimpairProcess;

/**
 * Returns an array, either empty or with parsed values
 */
function parseArray(str) {
    if (!str) {
        result = [];
    } else {
        var result = str.split(',').forEach(function (value) {
            // trim
            return value.replace(/^\s+|\s+$/g, '');
        });
        result = !!result ? result : [];
    }
    return result;
}

function buildCommandParams(query) {
    // var isDownlink = query.direction === 'downlink';
    var excluded = parseArray(query.excluded);

    excluded.push(PORT_SELENIUM_HUB);
    excluded.push(PORT_SELENIUM_NODE);
    excluded.push(PORT_HTTP);
    excluded.push(PORT_HTTPS);
    excluded.push(PORT_VNC);

    var included = parseArray(query.included);
    var type = query.type;

    var command = [];
    command.push('-n ' + query.networkInterface);

    if (included.length === 0) {
        // exclude all given addresses
        excluded.forEach(function (val) {
            if (val.match(SPEC_REGEX)) {
                command.push('--exclude ' + val);
            } else {
                if (val.match(IP_REGEX)) {
                    command.push('--exclude src=' + val);
                    command.push('--exclude dst=' + val);
                } else if (val.match(PORT_REGEX)) {
                    command.push('--exclude sport=' + val);
                    command.push('--exclude dport=' + val);
                }
                else {
                    throw 'UNKNOWN value to exclude: <' + val + '>';
                }
            }
        });
    }
    included.forEach(function (val) {
        if (val.match(SPEC_REGEX)) {
            command.push('--include ' + val);
        } else {
            if (val.match(IP_REGEX)) {
                command.push('--include src=' + val);
                command.push('--include dst=' + val);
            } else if (val.match(PORT_REGEX)) {
                command.push('--include sport=' + val);
                command.push('--include dport=' + val);
            }
            else {
                throw 'UNKNOWN value to exclude: <' + val + '>';
            }
        }
    });
    // if (isDownlink) {
    //     command.push('--inbound');
    // }
    command.push((type === 'limit' ? 'rate ' : 'netem') + ' --' + type + ' ' + query.value);
    command.push('--toggle ' + query.duration);
    return command.join(' ');
}

exports.isActive = function (req, res) {
    res.status(200).send(active);
};

exports.activate = function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (active) {
        res.status(400).send('already active');
    } else {
        active = true;

        var command = 'python ' + executable + ' ' + buildCommandParams(req.query);
        console.log(command);

        netimpairProcess = exec(command, function (err, stdout, stderr) {
            if (err) {
                console.log(err);
                console.log(stderr);
                res.status(500).send(stderr);
                active = false;
            } else {
                console.log(stdout);
                res.status(200).send('done');
            }
        });

        netimpairProcess.on('close', function (code, signal) {
            active = false;
        });
        netimpairProcess.on('exit', function (code, signal) {
            active = false;
        });
    }
};

exports.deactivate = function (req, res) {
    if (active) {
        netimpairProcess.kill('SIGTERM');
        res.status(200).send('deactivated')
    } else {
        res.status(200).send('already deactivated')
    }
    active = false;
};


