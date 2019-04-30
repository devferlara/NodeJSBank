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


var _connect_database_error = 'We\'re having issues with the database, please try again';

// Plaid client
var client = new plaid.Client(
	PLAID_CLIENT_ID,
	PLAID_SECRET,
	PLAID_PUBLIC_KEY,
	plaid.environments[PLAID_ENV],
	{ version: '2018-05-22' }
);


/*-------------------------------------------------------------------------------------
	Index 																			
--------------------------------------------------------------------------------------*/
api.get('/', function (req, res) {

	console.log("Slashes");
	if (req.session.user) {
		//Let's check if the logged in user have accounts
		//In order to show the add account button or the statistics view
		DB.runQuery(
			'SELECT ID, ITEM_ID, ACCESS_TOKEN, CREATED_AT FROM USER_ACCOUNTS WHERE USER_ID = ?',
			[
				req.session.user.id,
			])
			.then(data => {

				//All PLAID vars are for allow connect Plaid API in the website
				res.render('index', {
					username: req.session.user.username,
					PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
					PLAID_ENV: PLAID_ENV,
					PLAID_PRODUCTS: PLAID_PRODUCTS,
					accounts: data
				});
			})
			.catch(error => {
				res.render('index', {
					username: req.session.user.username,
					status: _connect_database_error
				});
			});

	} else {
		res.redirect('/login');
	}
});
/*-------------------------------------------------------------------------------------
	End of Index 																			
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	User signup 																			
--------------------------------------------------------------------------------------*/
api.get('/signup', function (req, res) {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.render('signup');
	}
});
/*-------------------------------------------------------------------------------------
	End of user signup 																			
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	User signout 																			
--------------------------------------------------------------------------------------*/
api.get('/signout', function (req, res) {
	req.session.destroy();
	res.redirect('/login');
});
/*-------------------------------------------------------------------------------------
	Enf of signout 																			
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Login 																			
--------------------------------------------------------------------------------------*/
api.get('/login', function (req, res) {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.render('signin');
	}
});
/*-------------------------------------------------------------------------------------
	End of login 																			
--------------------------------------------------------------------------------------*/





/*-------------------------------------------------------------------------------------
	Bank Accounts 																						
--------------------------------------------------------------------------------------*/
api.get('/accounts', function (req, res) {
	if (req.session.user) {
		res.render('accounts', {
			username: req.session.user.username,
			status: "ok"
		});
	} else {
		res.redirect('/login');
	}
});
/*-------------------------------------------------------------------------------------
	End of Bank accounts	 																		
--------------------------------------------------------------------------------------*/

module.exports = api;