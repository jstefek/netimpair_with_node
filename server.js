var express = require('express'),
    app = express(),
    port = process.env.PORT || 3333,
    bodyParser = require('body-parser'),
    route = require('./api/routes/route');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

route(app);

app.listen(port);

console.log('started on: ' + port);