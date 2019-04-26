'use strict'

var app = require('./app');
var port = process.env.port || 8080;

app.listen(port, function(){
    console.log("The server is running");
});