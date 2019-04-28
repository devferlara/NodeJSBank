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
var moment = require('moment');
var _ = require('lodash');

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


/*-------------------------------------------------------------------------------------
	Index 																			
--------------------------------------------------------------------------------------*/
api.get('/', function (req, res) {
	if (req.session.user) {

		//Let's check if the logged in user have accounts
		//In order to show the add account button or the statistics view
		DB.runQuery(
			'SELECT ID, ITEM_ID, ACCESS_TOKEN, CREATED_AT FROM USER_ACCOUNTS WHERE USER_ID = ?',
			[
				req.session.user.id,
			])
			.then(data => {

				return getTransactions(data);
			})
			.then(result => {

				result.forEach(function (data) {
					
					var grouped = _.groupBy(data.transactions, function (item) {
						return item.category;
					});

					console.log(grouped);
					console.log("Esto es un grouped");

				});

			})
			.then(result => {
				res.render('index', {
					username: req.session.user.username,
					PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
					PLAID_ENV: PLAID_ENV,
					PLAID_PRODUCTS: PLAID_PRODUCTS,
					accounts: 2
				});
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

async function getTransactions(array) {
	var data = [];
	for (const item of array) {
		let transactions = await new Promise((resolve, reject) => {

			var startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
			var endDate = moment().format('YYYY-MM-DD');
			client.getTransactions(item["ACCESS_TOKEN"], startDate, endDate, {
				count: 250,
				offset: 0,
			}, function (error, transactionsResponse) {
				if (error != null) {
					reject(error);
				} else {
					resolve(transactionsResponse)
				}
			});

		});
		data.push(transactions);
	}
	return data;
}
/*-------------------------------------------------------------------------------------
	End of Index 																			
--------------------------------------------------------------------------------------*/

api.get('/signup', function (req, res) {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.render('signup');
	}
});

api.get('/signout', function (req, res) {

	req.session.destroy();
	res.redirect('/login');

});

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
/*
*
*/

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
	End of Bank 		 																		
--------------------------------------------------------------------------------------*/

module.exports = api;