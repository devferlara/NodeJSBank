'use strict'

const mysql = require('mysql');
/*
* DBQuery allows to user execute a query directly in the database
* All queries are protected against SQL Injections
* @param {string} query -> Main SQL with placeholders "?"
* @param {[Object]} fields -> Data that will be sanitized into placeholders
* @return promise with result
*/
class DB {

	static runQuery(query, fields) {

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

}

module.exports = DB;
