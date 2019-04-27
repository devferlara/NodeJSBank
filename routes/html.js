'use strict'

var express = require('express');
var api = express();

api.get('/signup', function (req, res) {
	res.render('signup');
});

api.get('/index', function (req, res) {

	if (!req.session.user) {
		res.redirect('/login');
	} else {
		


		res.render('index', {
			username: req.session.user.username,
		});
	}

});

api.get('/login', function (req, res) {
	res.render('signin');
});


module.exports = api;