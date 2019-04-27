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
* Login for users
* Creates an express session every time a user is logged in
* @param {string} email
* @param {string} password
* @return [user_id, token, name, last name]
*/
api.get('/login', function (req, res) {

	connection.connect();

	connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
		if (error) throw error;
		console.log('The solution is: ', results[0].solution);
	});

	connection.end();

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
				DBQuery('INSERT INTO USERS (FIRST_NAME, LAST_NAME, EMAIL, PASSWORD) VALUES ("' + params.first_name + '", "' + params.last_name + '", "' + params.email + '", "' + hash + '")')
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
* 
*/
function DBQuery(query) {
	return new Promise((resolve, reject) => {
		connection.connect();
		connection.query(query, function (error, results) {
			if (error) {
				reject(error);
			} else {
				resolve(results);
			}
		});
		connection.end();
	});
}

function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}


module.exports = api;