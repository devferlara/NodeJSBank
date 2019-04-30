'use strict'

var express = require('express');
var session = require('express-session');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var MySQLStore = require('express-mysql-session')(session);

var options = {
	host: 'adldb.cyv7jndgjtwk.us-east-2.rds.amazonaws.com',
	port: 3306,
	user: 'root',
	password: 'Eda241flop4r3',
	database: 'Plaid'
}; 

var app = express();
var sessionStore = new MySQLStore(options);

app.use(helmet());
app.use('/static', express.static('public'));
app.set('view engine', 'ejs');

app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
	session(
		{
			secret: 'Runj37#&$rw3#$+3Ut?fUKaC4up*3@eDR',
			resave: false,
			store: sessionStore,
			saveUninitialized: true,
			cookie  : { secure: false, maxAge  : new Date(Date.now() + (1800000)) }
		}
	)
);

/*
* We create two principal route files
* API: Handles all REST queries (POST/GET)
* HTML: Returns all views in the app (GET)
*/
var api_routes = require('./routes/api');
var html_routes = require('./routes/html');
app.use('/api', api_routes);
app.use('/', html_routes);

module.exports = app;