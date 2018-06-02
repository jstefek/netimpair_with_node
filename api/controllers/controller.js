'use strict';
var exec = require('child_process').exec, file = __dirname + '/netimpair.py';

exports.netimpair = function (req, res) {
    console.log(req.query.params);
    res.setHeader('Access-Control-Allow-Origin', '*');
    exec('python ' + file + ' ' + req.query.params, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            console.log(stderr);
            res.status(500).send(stderr)
        } else {
            console.log(stdout);
            res.status(200).send('done')
        }
    });
};
