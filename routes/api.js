'use strict'

var express = require('express');
var mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

var api = express();

var connection = mysql.createConnection({
	host: 'adldb.cyv7jndgjtwk.us-east-2.rds.amazonaws.com',
	user: 'root',
	password: 'Eda241flop4r3',
	database: 'Plaid'
});


/*
* String definitions
*/
var _email_required = 'Email is required';
var _password_required = 'Password is required';

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
		'SELECT ID, FIRST_NAME, EMAIL, PASSWORD FROM USERS WHERE EMAIL = ? AND PASSWORD = ?',
		[
			params.email,
			params.password,
		])
		.then(data => {

			if (data.length == 0) {

			} else {
				
			}

			console.log(data);
			/*
			bcrypt.compare(params.password, hash, function (err, res) {
				if (res) {
		
				}
				// res == true
			});
			*/

			res.status(200).send();
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
						ucfirst(params.first_name),
						ucfirst(params.last_name),
						params.email.toLowerCase(),
						hash
					])
					.then(data => {
						res.status(200).send();
					})
					.catch(error => {
						console.log(error);

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

/*
* DBQuery allows to user execute a query directly in the database
* All queries are protected against SQL Injections
* @param {string} query -> Main SQL with placeholders "?"
* @param {[Object]} fields -> Data that will be sanitized into placeholders
* @return promise with result
*/
function DBQuery(query, fields) {
	return new Promise((resolve, reject) => {
		connection.connect();
		connection.query(query, fields, function (error, results) {
			if (error) {
				reject(error);
			} else {
				resolve(results);
			}
			connection.end();
		});
	});
}


function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

function ucfirst(str) {
	var firstLetter = str.slice(0,1);
	return firstLetter.toUpperCase() + str.substring(1);
}

module.exports = api;