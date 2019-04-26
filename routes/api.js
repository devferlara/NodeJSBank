'use strict'

var express = require('express');

var api = express();

/*
* Login for users
* Creates an express session every time a user is logged in
* @param {string} email
* @param {string} password
* @return [user_id, token, name, last name]
*/
api.get('/login', function (req, res) {

	console.log(req.session.user);

	res.render('signup');

	/*
	if (req.session.user) {
		res.status(200).send(
			{
				status: 'rokudaime',
				soluble: 'arena',
				user: req.session.user
			}
		);
	} else {
		req.session.user = { usuario: "diego lara" };
		res.status(400).send(
			{
				status: 'no esta logueado' 
			}
		);
	}
	*/
});


module.exports = api;