'use strict'

var express = require('express');
var api = express();
const plaid = require('plaid');
const DB = require('../helpers/DB');
const PLAID_CLIENT_ID = '5c813c380c368f0012c2e8ed';
const PLAID_SECRET = 'b416a1e08275b0de5251a46f3a5b8c';
const PLAID_PUBLIC_KEY = '5049c988e7104f6947fa3f78c5760f';
var PLAID_PRODUCTS = 'transactions';
const PLAID_ENV = 'sandbox';

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

api.get('/', function (req, res) {
	if (req.session.user) {

		//Let's check if the logged in user have accounts
		//In order to show the add button or the statistics view
		DB.runQuery(
			'SELECT ID, ITEM_ID, ACCESS_TOKEN, CREATED_AT FROM USER_ACCOUNTS WHERE USER_ID = ?',
			[
				req.session.user.id,
			])
			.then(data => {

				if (data.length == 0) {
					res.render('index', {
						username: req.session.user.username,
						PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
						PLAID_ENV: PLAID_ENV,
						PLAID_PRODUCTS: PLAID_PRODUCTS,
						accounts: 0
					});
				} else {
					res.render('index', {
						username: req.session.user.username,
						PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
						PLAID_ENV: PLAID_ENV,
						PLAID_PRODUCTS: PLAID_PRODUCTS,
						accounts: data.length
					});
				}

			})
			.catch(error => {
				console.log(error);
				var defaultError = "We're having issues with the database, please try again";
				res.render('index', {
					username: req.session.user.username,
					status: "error"
				});
			});

	} else {
		res.redirect('/login');
	}
});

api.get('/signup', function (req, res) {
	if (req.session.user) {
		res.redirect('/index');
	} else {
		res.render('signup');
	}
});

api.get('/signout', function (req, res) {

	req.session.destroy();
	res.redirect('/login');

});

api.get('/login', function (req, res) {
	if (req.session.user) {
		res.redirect('/index');
	} else {
		res.render('signin');
	}
});


api.get('/accounts', function (req, res) {

	if (req.session.user) {

		DB.runQuery(
			'SELECT ID, ITEM_ID, ACCESS_TOKEN, CREATED_AT FROM USER_ACCOUNTS WHERE USER_ID = ?',
			[
				req.session.user.id,
			])
			.then(data => {

				var accounts = [];
				console.log(data.length);
				for (var i = 0; i < data.length; i++) {
					console.log("Acces token " + data[i]["ACCESS_TOKEN"]);
					client.getItem(data[i]["ACCESS_TOKEN"], function (error, itemResponse) {

						if (error != null) {
							prettyPrintResponse(error);
							return response.json({
								error: error
							});
						}
						client.getInstitutionById(itemResponse.item.institution_id, { include_display_data: true }, function (err, instRes) {
							if (err != null) {
								var msg = 'Unable to pull institution information from the Plaid API.';
								console.log(msg + '\n' + JSON.stringify(error));
								return response.json({
									error: msg
								});
							} else {
								//console.log(instRes);
								accounts.push({
									bank: instRes.institution.name,
									created: new Date(data[i]["CREATED_AT"]).toLocaleString(),
									account_id: data[0]["ID"]
								});

								console.log("iteracion");
								if (i == (data.length - 1)) {
									res.render('accounts', {
										username: req.session.user.username,
										status: "ok",
										data: accounts
									});
								}

							}
						});


					});

				}

			})
			.catch(error => {
				console.log(error);
				var defaultError = "We're having issues with the database, please try again";
				res.render('accounts', {
					username: req.session.user.username,
					status: "error"
				});
			});




	} else {
		res.redirect('/login');
	}


});


module.exports = api;