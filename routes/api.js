'use strict'

const express = require('express');
const jwt = require('express-jwt')
const jwtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
const secret = { secret: 'd5faecb1ffc339abe44b095aad052069' }

const DB = require('../helpers/DB');

const plaid = require('plaid');
const PLAID_CLIENT_ID = '5c813c380c368f0012c2e8ed';
const PLAID_SECRET = 'b416a1e08275b0de5251a46f3a5b8c';
const PLAID_PUBLIC_KEY = '5049c988e7104f6947fa3f78c5760f';
const PLAID_ENV = 'sandbox';
var PLAID_PRODUCTS = 'transactions';

var api = express();

/*
* String definitions
*/
var _email_required = 'Email is required';
var _password_required = 'Password is required';
var _user_does_not_exists = 'User does not exists';
var _user_password_incorrect = 'Password incorrect';

/*
* Plaid client
*/
var client = new plaid.Client(
	PLAID_CLIENT_ID,
	PLAID_SECRET,
	PLAID_PUBLIC_KEY,
	plaid.environments[PLAID_ENV],
	{ version: '2018-05-22' }
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

	DB.runQuery(
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
						req.session.user = { id: data[0]["ID"], username: data[0]["FIRST_NAME"] + " " + data[0]["LAST_NAME"] }
						var token = jwtoken.sign({
							id: data[0]["ID"],
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
				DB.runQuery(
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

			DB.runQuery(
				'INSERT INTO USER_ACCOUNTS (USER_ID, ITEM_ID, ACCESS_TOKEN) VALUES (?, ?, ?)',
				[
					req.user.id,
					tokenResponse.item_id,
					tokenResponse.access_token
				])
				.then(data => {
					res.status(200).send({ status: "User account created" });
				})
				.catch(error => {
					console.log(error)
					var defaultError = "We're having issues with the database, please try again";
					if (error.errno == 1062) {
						defaultError = "Email already exists";
					}
					res.status(400).send({ "error": defaultError });
				});

		});

	} else {

		res.status(400).send({
			error: "Invalid or malformed token!"
		});

	}

});

api.post('/remove_account', jwt(secret), (req, res) => {

	if (req.user.loggued) {

		var params = req.body;

		if (!params.account) {
			res.status(400).send({ error: 'Account id is required' });
		}

		DB.runQuery(
			'DELETE FROM USER_ACCOUNTS WHERE id = ?',
			[
				params.account,
			])
			.then(data => {
				res.status(200).send({ status: "This account has been deleted" });
			})
			.catch(error => {
				console.log(error)
				var defaultError = "We're having issues with the database, please try again";
				if (error.errno == 1062) {
					defaultError = "Email already exists";
				}
				res.status(400).send({ "error": defaultError });
			});

	}

});



function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

function ucfirst(str) {
	var firstLetter = str.slice(0, 1);
	return firstLetter.toUpperCase() + str.substring(1);
}

module.exports = api;