'use strict'

const express = require('express');
const jwt = require('express-jwt')
const jwtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var moment = require('moment');
const DB = require('../helpers/DB');
var _ = require('lodash');

const plaid = require('plaid');
const PLAID_CLIENT_ID = '5c813c380c368f0012c2e8ed';
const PLAID_SECRET = 'b416a1e08275b0de5251a46f3a5b8c';
const PLAID_PUBLIC_KEY = '5049c988e7104f6947fa3f78c5760f';
const PLAID_ENV = 'sandbox';

var api = express();

// String definitions
var _connect_database_error = 'We\'re having issues with the database, please try again';
var _user_is_not_logged_in = 'You\'re not logged in';

var _login_email_required = 'Email is required';
var _login_password_required = 'Password is required';
var _login_user_not_exists = 'User does not exists';
var _login_user_password_incorrect = 'Password incorrect';

var _signup_first_name_required = 'First name is required';
var _signup_last_name_required = 'Last name is required';
var _signup_email_invalid = 'A valid email is required';
var _signup_password_required = 'Password is required';
var _signup_password_creation_error = 'Has been an error in the process, please try again.';
var _signup_email_already_exists = 'Email already exists';

var _accestoken_token_required = 'Public token is required';
var _accestoken_plaid_error = 'We are having issues to connect to the Plaid API';

var _remove_account_id_required = 'The account id is required';

// Plaid client
var client = new plaid.Client(
	PLAID_CLIENT_ID,
	PLAID_SECRET,
	PLAID_PUBLIC_KEY,
	plaid.environments[PLAID_ENV],
	{ version: '2018-05-22' }
);

// Bcrypt settings
const saltRounds = 10;
const secret = { secret: 'd5faecb1ffc339abe44b095aad052069' }

/*-------------------------------------------------------------------------------------
	Login																			
--------------------------------------------------------------------------------------*/
/*
* Login for users
* Creates an express session every time a user is logged in
* @param {string} email
* @param {string} password
* @return token -> JWTToken with user info (Has to be sended in every API request)
*/
api.post('/login', function (req, res) {

	var params = req.body;

	//Validation for required data
	if (!params.email) { res.status(400).send({ error: _login_email_required }); }
	if (!params.password) { res.status(400).send({ error: _login_password_required }); }

	//Check if the user exists in database
	DB.runQuery('SELECT ID, FIRST_NAME, LAST_NAME, EMAIL, PASSWORD FROM USERS WHERE EMAIL = ?', [params.email.toUpperCase()])
		.then(data => {

			if (data.length == 0) {
				res.status(400).send({ error: _login_user_not_exists });
			} else {

				//We compare the provided password against the password in database
				//Bcript provides the following method
				bcrypt.compare(params.password, data[0]["PASSWORD"], function (err, result) {
					if (result) {

						//If the passwords match we create a session with the user information
						req.session.user = { id: data[0]["ID"], username: data[0]["FIRST_NAME"] + " " + data[0]["LAST_NAME"] }

						//A JWT token is sended to the user with the following data
						//The token must be sent in every API request
						var token = jwtoken.sign({
							id: data[0]["ID"],
							loggued: true
						}, secret.secret);
						res.status(200).send({ token: token });
					} else {
						res.status(400).send({ error: _login_user_password_incorrect });
					}
				});
			}

		})
		.catch(error => {
			res.status(400).send({ "error": _connect_database_error });
		});

});
/*-------------------------------------------------------------------------------------
	End of login																		
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Signup 																		
--------------------------------------------------------------------------------------*/
/*
* Signup for users
* @param {string} firstname
* @param {string} lastname
* @param {string} email
* @param {string} password
* @return [error] only if has error. HTTPCode 200 if OK / HTTPCode 400 if has errors
*/
api.post('/signup', function (req, res) {

	var params = req.body;

	//Validation for required data
	if (!params.first_name) { res.status(400).send({ error: _signup_first_name_required }); }
	if (!params.last_name) { res.status(400).send({ error: _signup_last_name_required }); }
	if (!validateEmail(params.email)) { res.status(400).send({ error: _signup_email_invalid }); }
	if (!params.password) { res.status(400).send({ error: _signup_password_required }); }

	//We generate a secure password through Bcrypt
	bcrypt.genSalt(saltRounds, function (err, salt) {
		bcrypt.hash(params.password, salt, function (err, hash) {

			if (err) {
				res.status(400).send({ error: _signup_password_creation_error });
			} else {

				//If everything is fine we save the user in the database
				DB.runQuery(
					'INSERT INTO USERS (FIRST_NAME, LAST_NAME, EMAIL, PASSWORD) VALUES (?, ?, ?, ?)',
					[
						params.first_name.toLowerCase(),
						params.last_name.toLowerCase(),
						params.email.toLowerCase(),
						hash
					])
					.then(data => {
						res.status(200);
					})
					.catch(error => {
						//1062 = Email already exists
						if (error.errno == 1062) {
							defaultError = _signup_email_already_exists;
						} else {
							defaultError = _connect_database_error;
						}
						res.status(400).send({ "error": defaultError });
					});
			}

		});
	});

});
/*-------------------------------------------------------------------------------------
	End of signup 																		
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Acces token 																		
--------------------------------------------------------------------------------------*/
/*
* API to get an Access token from a public token.
* @param {string} public_token
* @return [error] only if has error. HTTPCode 200 if OK / HTTPCode 400 if has errors
*/
api.post('/get_access_token', jwt(secret), (req, res) => {

	if (req.user.loggued) {

		var params = req.body;

		//Validation for required data
		if (!params.public_token) { res.status(400).send({ error: _accestoken_token_required }); }

		/*
		* We need to exchange the public_token in order to get a private token
		* The client is setting up previuosly
		* That token must be used in every request to the Plaid API
		*/
		client.exchangePublicToken(params.public_token, function (error, tokenResponse) {

			if (error) {
				res.status(400).send({ error: _accestoken_plaid_error });
			} else {

				//We store the user account info in the database
				DB.runQuery(
					'INSERT INTO USER_ACCOUNTS (USER_ID, ITEM_ID, ACCESS_TOKEN) VALUES (?, ?, ?)',
					[
						req.user.id,
						tokenResponse.item_id,
						tokenResponse.access_token
					])
					.then(data => {
						res.status(200);
					})
					.catch(error => {
						res.status(400).send({ "error": _connect_database_error });
					});

			}

		});

	} else {
		res.status(400).send({ "error": _user_is_not_logged_in });
	}

});
/*-------------------------------------------------------------------------------------
	End of acces token 																		
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Remove account 																		
--------------------------------------------------------------------------------------*/
/*
* API to remove a user's account
* @param {string} account id
* @return [error] only if has error. HTTPCode 200 if OK / HTTPCode 400 if has errors
*/
api.post('/remove_account', jwt(secret), (req, res) => {

	if (req.user.loggued) {

		var params = req.body;

		if (!params.account) { res.status(400).send({ error: _remove_account_id_required }); }

		DB.runQuery(
			'DELETE FROM USER_ACCOUNTS WHERE id = ?',
			[
				params.account,
			])
			.then(data => {
				res.status(200);
			})
			.catch(error => {
				res.status(400).send({ "error": _connect_database_error });
			});

	} else {
		res.status(400).send({ "error": _user_is_not_logged_in });
	}

});
/*-------------------------------------------------------------------------------------
	End of remove account 																		
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Get account items / institutions / transactions / accounts 																		
--------------------------------------------------------------------------------------*/
api.post('/accounts_data', jwt(secret), (req, res) => {

	if (req.user.loggued) {

		var params = req.body;

		DB.runQuery(
			'SELECT ID, ITEM_ID, ACCESS_TOKEN, CREATED_AT FROM USER_ACCOUNTS WHERE USER_ID = ?',
			[
				req.user.id,
			])
			.then(data => {
				return getTransactions(data, params.start, params.end);
			})
			.then(result => {

				var array = [];
				var grouped = [];

				result.forEach(function (data) {
					grouped = _.groupBy(data.transactionsRaw.transactions, function (item) {
						return item.category;
					});
					array.push({
						name: data.bank,
						id: data.account_id,
						accounts: data.transactionsRaw.accounts,
						transactions: grouped
					});
				});

				return array;

			})
			.then(result => {
				res.status(200).send({
					data: result,
					month: moment(params.start).format('MMMM YYYY')
				});
			})
			.catch(error => {
				var defaultError = "We're having issues with the database, please try again";
				res.status(400).send({
					username: req.session.user.username,
					status: "error"
				});
			});
	}

});

async function getTransactions(array, start, end) {

	var data = [];
	for (const item of array) {
		let transactions = await new Promise((resolve, reject) => {

			client.getItem(item["ACCESS_TOKEN"], function (error, itemResponse) {
				if (error != null) {
					reject(error);
				}
				client.getInstitutionById(itemResponse.item.institution_id, function (err, instRes) {
					if (err != null) {
						reject(error);
					} else {

						client.getTransactions(item["ACCESS_TOKEN"], start, end, {
							count: 250,
							offset: 0,
						}, function (error, transactionsResponse) {
							if (error != null) {
								reject(error);
							} else {

								resolve({
									bank: instRes.institution.name,
									account_id: item["ID"],
									transactionsRaw: transactionsResponse
								});
							}
						});

					}
				});
			});

		});

		data.push(transactions);

	}

	return data;
}
/*-------------------------------------------------------------------------------------
	End of Get account items / institutions / transactions / accounts 																		
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Get account and institutions																		
--------------------------------------------------------------------------------------*/
api.post('/accounts', jwt(secret), (req, res) => {

	if (req.user.loggued) {

		DB.runQuery(
			'SELECT ID, ITEM_ID, ACCESS_TOKEN, CREATED_AT FROM USER_ACCOUNTS WHERE USER_ID = ?',
			[
				req.user.id,
			])
			.then(data => {
				return processAccounts(data);
			})
			.then(data => {
				res.status(200).send({
					data: data
				});
			})
			.catch(error => {
				var defaultError = "We're having issues with the database, please try again";
				res.status(400).send({
					status: "error"
				});
			});

	}

});

async function processAccounts(array) {
	var data = [];
	for (const item of array) {
		let account = await new Promise((resolve, reject) => {
			client.getItem(item["ACCESS_TOKEN"], function (error, itemResponse) {
				if (error != null) {
					reject(error);
				}
				client.getInstitutionById(itemResponse.item.institution_id, function (err, instRes) {
					if (err != null) {
						reject(error);
					} else {
						var data = {
							bank: instRes.institution.name,
							created: new Date(item["CREATED_AT"]).toLocaleString(),
							account_id: item["ID"]
						}
						resolve(data);
					}
				});
			});
		});
		data.push(account);
	}
	return data;
}
/*-------------------------------------------------------------------------------------
	End of Get account and institutions																		
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Helper classes																		
--------------------------------------------------------------------------------------*/
function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}
/*-------------------------------------------------------------------------------------
	End of Helper classes																		
--------------------------------------------------------------------------------------*/

module.exports = api;