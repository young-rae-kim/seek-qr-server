const poolPromise = require('../config/database');

module.exports = {

	// Execute query without value
	queryParam: async (query) => {
		return new Promise (async (resolve, reject) => {
			try {
				// Initialize connection pool
				const pool = await poolPromise;

				// Initialize connection
				const connection = await pool.getConnection();
				
				// Execute query
				try {
					const result = await connection.query(query);
					connection.release();
					resolve(result);
				} catch (e) {
					connection.release();
					reject(e);
				}
			} catch (e) {
				reject(e);
			}
		});
	},

	// Execute query with input value
	queryParamArr: async (query, value) => {
		return new Promise (async (resolve, reject) => {
			try {
				const pool = await poolPromise;
				const connection = await pool.getConnection();

				// Execute query with input value
				try {
					const result = await connection.query(query, value);
					connection.release();
					resolve(result);
				} catch (e) {
					connection.release();
					reject(e);
				}
			} catch (e) {
				reject(e);
			}
		});

	},

	// Manipulate single change in database
	queryTransaction: async (query) => {
		return new Promise (async (resolve, reject) => {
			try {
				const pool = await poolPromise;
				const connection = await pool.getConnection();
				
				// Execute single transaction
				try {
					await connection.beginTransaction();
					const result = await connection.query(query);
					await connection.commit();
					connection.release();
					resolve(result);
				} catch (e) {
					await connection.rollback();
					connection.release();
					reject(e);
				}
			} catch (e) {
				reject(e);
			}
		});
	},


	// Manipulate single change in database
	queryTransactionArr: async (query, value) => {
		return new Promise (async (resolve, reject) => {
			try {
				const pool = await poolPromise;
				const connection = await pool.getConnection();
				
				// Execute single transaction
				try {
					await connection.beginTransaction();
					const result = await connection.query(query, value);
					await connection.commit();
					connection.release();
					resolve(result);
				} catch (e) {
					await connection.rollback();
					connection.release();
					reject(e);
				}
			} catch (e) {
				reject(e);
			}
		});
	},



	// Manipulate multiple changes in database (with function arguments)
	queryTransactions: async (...args) => {
		return new Promise (async (resolve, reject) => {
			try {
				const pool = await poolPromise;
				const connection = await pool.getConnection();
				try {
					await connection.beginTransaction();

					// Execute all transaction functions in parallel
					const result = await Promise.all(args.map(async (it) => await connection.query(it)));
					await connection.commit();
					connection.release();
					resolve(result);
				} catch (e) {
					await connection.rollback();
					connection.release();
					reject(e);
				}
			} catch (e) {
				reject(e);
			}
		});
	},
	
	// Manipulate multiple changes in database (with function arguments)
	queryTransactionsAsync: async (...args) => {
		return new Promise (async (resolve, reject) => {
			try {
				const pool = await poolPromise;
				const connection = await pool.getConnection();
				try {
					let result = "";
					await connection.beginTransaction();

					// Execute all transaction functions in order
					for await (const it of args) {
						result = await connection.query(it);
					}
					// await Promise.all(args.map(async (it) => await connection.query(it)));
					await connection.commit();
					connection.release();
					resolve(result);
				} catch (e) {
					await connection.rollback();
					connection.release();
					reject(e);
				}
			} catch (e) {
				reject(e);
			}
		});
	}
}
