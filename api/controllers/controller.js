'use strict';
var exec = require('child_process').exec,
    executable = __dirname + '/netimpair.py',
    active = false,
    PORT_HTTPS = process.env.PORT_HTTPS || 443,
    PORT_HTTP = process.env.PORT_HTTP || 80,
    netimpairProcess;

function parseArray(str) {
    if (!str) {
        result = [];
    } else {
        var result = str.split(',').forEach(function (value) {
            return value.replace(/^\s+|\s+$/g, '');
        });
        result = !!result ? result : [];
    }
    return result;
}

function buildCommandParams(query) {
    var isDownlink = query.direction == 'downlink';
    var direction = isDownlink ? 'src' : 'dst';
    var excluded = parseArray(query.excluded);
    var included = parseArray(query.included);
    var type = query.type;

    var command = [];
    command.push('-n ' + query.networkInterface);

    if (!included || included.length == 0) {
        // exclude all given addresses
        excluded.forEach(function (val) {
            command.push('--exclude src=' + val);
            command.push('--exclude dst=' + val);
        });
        command.push('--exclude dport=' + PORT_HTTPS);
        command.push('--exclude sport=' + PORT_HTTPS);
        command.push('--exclude dport=' + PORT_HTTP);
        command.push('--exclude sport=' + PORT_HTTP);
        command.push('--exclude dport=4444');
        command.push('--exclude sport=4444');
    }
    included.forEach(function (val) {
        command.push('--include ' + direction + '=' + val);
    });
    if (isDownlink) {
        command.push('--inbound');
    }
    command.push((type == 'limit' ? 'rate ' : 'netem') + ' --' + type + ' ' + query.value)
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


