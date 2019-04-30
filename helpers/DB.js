'use strict'

const mysql = require('mysql');
var config = require('../conf');

/*
* DBQuery allows to user execute a query directly in the database
* All queries are protected against SQL Injections
* @param {string} query -> Main SQL with placeholders "?"
* @param {[Object]} fields -> Data that will be sanitized into placeholders
* @return promise with query result
*/
class DB {

	static runQuery(query, fields) {

		var connection = mysql.createConnection({
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.password,
			database: config.database
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
