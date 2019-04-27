'use strict'

const express = require('express');
const mysql = require('mysql');
const jwt = require('express-jwt')
const jwtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
const secret = { secret: 'd5faecb1ffc339abe44b095aad052069' }

const plaid = require('plaid');
const PLAID_CLIENT_ID = '5c813c380c368f0012c2e8ed';
const PLAID_SECRET = 'b416a1e08275b0de5251a46f3a5b8c';
const PLAID_PUBLIC_KEY = '5049c988e7104f6947fa3f78c5760f';
const PLAID_ENV = 'sandbox';

var api = express();

/*
* String definitions
*/
var _email_required = 'Email is required';
var _password_required = 'Password is required';
var _user_does_not_exists = 'User does not exists';
var _user_password_incorrect = 'Password incorrect';

/*
* Plaid credentials
*/
var client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV],
  {version: '2018-05-22'}
);

/*
* Login for users
* Creates an express session every time a user is logged in
* @param {string} email
* @param {string} password
* @return [user_id, token, name, last name]
*/
api.post('/login', function (req, res) {

	var params = req.body;

	if (!params.email) {
		res.status(400).send({ error: _email_required });
	}

	if (!params.password) {
		res.status(400).send({ error: _password_required });
	}

	DBQuery(
		'SELECT ID, FIRST_NAME, LAST_NAME, EMAIL, PASSWORD FROM USERS WHERE EMAIL = ?',
		[
			params.email.toUpperCase(),
		])
		.then(data => {

			if (data.length == 0) {
				res.status(400).send({ error: _user_does_not_exists });
			} else {
				bcrypt.compare(params.password, data[0]["PASSWORD"], function (err, result) {
					if (result) {
						console.log(data);
						req.session.user = { id: data[0]["id"], username: data[0]["FIRST_NAME"] + " " + data[0]["LAST_NAME"] }
						var token = jwtoken.sign({
							id: data[0]["id"],
							loggued: true
						}, secret.secret);
						res.status(200).send({ token: token });
					} else {
						res.status(400).send({ error: _user_password_incorrect });
					}
				});
			}

		})
		.catch(error => {
			console.log(error);
			var defaultError = "We're having issues with the database, please try again";
			res.status(400).send({ "error": defaultError });
		});

});



api.post('/signup', function (req, res) {

	var params = req.body;

	if (!params.first_name) {
		res.status(400).send({ error: 'First name is required' });
	}

	if (!params.last_name) {
		res.status(400).send({ error: 'Last name is required' });
	}

	if (!validateEmail(params.email)) {
		res.status(400).send({ error: 'A valid email is required' });
	}

	if (!params.password) {
		res.status(400).send({ error: 'Password is required' });
	}

	bcrypt.genSalt(saltRounds, function (err, salt) {
		bcrypt.hash(params.password, salt, function (err, hash) {

			if (err) {
				res.status(400).send({ error: 'Has been an error in the process, please try again.' });
			} else {
				DBQuery(
					'INSERT INTO USERS (FIRST_NAME, LAST_NAME, EMAIL, PASSWORD) VALUES (?, ?, ?, ?)',
					[
						params.first_name.toLowerCase(),
						params.last_name.toLowerCase(),
						params.email.toLowerCase(),
						hash
					])
					.then(data => {
						res.status(200).send();
					})
					.catch(error => {
						var defaultError = "We're having issues with the database, please try again";
						if (error.errno == 1062) {
							defaultError = "Email already exists";
						}
						res.status(400).send({ "error": defaultError });
					});
			}

		});
	});

});


api.post('/get_access_token', jwt(secret), (req, res) => {

	if (req.user.loggued) {

		var params = req.body;

		if (!params.public_token) {
			res.status(400).send({ error: 'Public token is required' });
		}

		client.exchangePublicToken(params.public_token, function (error, tokenResponse) {
			if (error) {
				res.status(400).send({
					error: error,
				});
			}

			console.log(tokenResponse);
			/*
			ACCESS_TOKEN = tokenResponse.access_token;
			ITEM_ID = tokenResponse.item_id;
			prettyPrintResponse(tokenResponse);
			res.status(200).send({
				access_token: ACCESS_TOKEN,
				item_id: ITEM_ID,
				error: null,
			});
			*/

		});

	} else {

		res.status(400).send({
			error: "Invalid or malformed token!"
		});

	}

});

/*
api.post('/data', jwt(secret), (req, res) => {
	if (req.user.loggued) {
		return res.status(200).send({ status: "ok" });
	}
	res.status(401).send({ message: 'not authorized' });
})

/*
* DBQuery allows to user execute a query directly in the database
* All queries are protected against SQL Injections
* @param {string} query -> Main SQL with placeholders "?"
* @param {[Object]} fields -> Data that will be sanitized into placeholders
* @return promise with result
*/
function DBQuery(query, fields) {

	var connection = mysql.createConnection({
		host: 'adldb.cyv7jndgjtwk.us-east-2.rds.amazonaws.com',
		user: 'root',
		password: 'Eda241flop4r3',
		database: 'Plaid'
	});

	return new Promise((resolve, reject) => {
		connection.connect();
		connection.query(query, fields, function (error, results) {
			if (error) {
				reject(error);
			} else {
				resolve(results);
			}
		});
	});
}


function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

function ucfirst(str) {
	var firstLetter = str.slice(0, 1);
	return firstLetter.toUpperCase() + str.substring(1);
}

module.exports = api;