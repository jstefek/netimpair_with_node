'use strict';
const networkInterfacesJson = require('os').networkInterfaces(),
    ip = require("ip").address(),
    {NetworkImpairment} = require('../helpers/networkImpairment'),
    {spawn} = require('child_process'),
    networkInterfaces = [];
let active = false, impairment;

let cmds = [];
cmds.push('touch /var/log/node.log');
cmds.push('touch /var/log/selenium.log');
cmds.push('chown seluser /var/log/selenium.log');
cmds.push('chown seluser /var/log/node.log');
cmds.push("su seluser -c 'mkdir -p ~/.vnc && x11vnc -storepasswd $VNC_PASSWORD ~/.vnc/passwd && /opt/bin/entry_point.sh > /var/log/selenium.log'");

spawn(cmds.join(' && '), {shell: true});

console.log(`local ip: ${ip}`);

for (let i in networkInterfacesJson) {
    networkInterfaces.push(i);
}

function isImpairmentActive() {
    return !!impairment && impairment.isActive();
}

exports.isActive = function (req, res) {
    res.status(200).send(!!impairment && impairment.isActive());
};

exports.activate = function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (isImpairmentActive()) {
        res.status(400).send('already active');
    } else {
        impairment = new NetworkImpairment(req.query);
        impairment.activate().then(function () {
            res.status(200).send('command executed');
        }).catch(function (err) {
            res.status(500).send('impairment was not set');
            console.log(err)
        });
    }
};

exports.deactivate = function (req, res) {
    if (isImpairmentActive()) {
        impairment.deactivate().then(function () {
            res.status(200).send('deactivated');
        }).catch(function (err) {
            console.log(err);
            res.status(500).send('problem with deactivation');
        });
    } else {
        console.log('already deactivated');
        res.status(200).send('already deactivated')
    }
    active = false;
};

exports.getNetworkInterfaces = function (req, res) {
    res.status(200).send(networkInterfaces);
};

exports.getIP = function (req, res) {
    res.status(200).send(ip);
};
