'use strict'

var express = require('express');
var session = require('express-session');
var helmet = require('helmet');
var bodyParser = require('body-parser');

var app = express();

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
			saveUninitialized: true,
			cookie: { secure: false },
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