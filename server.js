var express = require('express'),
    app = express(),
    port = process.env.PORT || 3333,
    bodyParser = require('body-parser'),
    route = require('./api/routes/route'),
    https = require('https'),
    fs = require('fs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

route(app);

var options = {
    key: fs.readFileSync(__dirname + '/localhost.key'),
    cert: fs.readFileSync(__dirname + '/localhost.crt'),
    requestCert: false,
    rejectUnauthorized: false
};

var server = https.createServer(options, app).listen(port, function () {
    console.log("server started at port " + port);
});



