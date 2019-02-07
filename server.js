const express = require('express'),
    app = express(),
    portHTTP = process.env.PORT_HTTP || 3333,
    portHTTPS = process.env.PORT_HTTPS || 3334,
    bodyParser = require('body-parser'),
    route = require('./api/routes/route'),
    https = require('https'),
    http = require('http'),
    fs = require('fs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
route(app);

httpsOptions = {
    key: fs.readFileSync(__dirname + '/localhost.key'),
    cert: fs.readFileSync(__dirname + '/localhost.crt'),
    requestCert: false,
    rejectUnauthorized: false
};
https.createServer(httpsOptions, app).listen(portHTTPS, function () {
    console.log("server listens at https://localhost:" + portHTTPS);
});

http.createServer(app).listen(portHTTP, function () {
    console.log("server listens at http://localhost:" + portHTTP);
});

