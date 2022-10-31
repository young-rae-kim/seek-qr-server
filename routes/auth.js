// Deploying express and its router, Fetching modules for database via mysql
var mysql = require('mysql')
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')
var keccak224 = require('js-sha3').keccak224

// Send respond for authentication
// return function that send query result with status
function sendAuthRespond (is_artist) {
	return async function (req, res, next) {

		// provider and its ID
		const provider = req.body.provider
		const provider_id = req.body.provider_id
		const values = [provider, provider_id]

		// Generate query string by concatenation
		const query = (is_artist) 

			// Search verified user_id for given authentication information
			? 'SELECT oauth.user_id' +
				' FROM oauth' +
				' JOIN user' +
				' ON user.id = oauth.user_id' +
				' WHERE oauth.provider = ?' +
				' AND oauth.provider_id = ?' +
				" AND user.verified = b'1'"

			// Search user_id for given authentication information
			: 'SELECT user_id' + 
				' FROM oauth' +
				' WHERE provider = ?' +
				' AND provider_id = ?'

		// Execute query and send the result
		try {
			const result = await pool.queryParamArr(query, values)
			if (result[0].length === 0) {
				res.status(404).send(result)
			} 
			else {
				res.send(result)
			}
		}

		// Error handling
		catch (e) {
			console.log(e.name + ": " + e.message)
			res.status(500).send(e)
		}
	}
}

// Send respond for registeration (OAuth2 information)
// return function that send query result with status
function sendRegisterRespond () {
	return async function (req, res, next) {

		// access_token, provider
		const provider = req.body.provider
		const provider_id = req.body.provider_id
		const nickname = req.body.nickname

		let page_id = ''
		const create_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const create_date = new Date()
		const user_values = [page_id, nickname, create_ip, create_date]

		// Generate query string by concatenation
		const user_query = 

			// Insert user information
			'INSERT INTO user' +
				' (page_id, nickname, create_ip, create_date)' +
				' VALUES (?, ?, ?, ?); '

		const oauth_query = 

			// Insert OAuth2 information
			'INSERT INTO oauth' +
				' (provider, user_id, provider_id)' +
				' VALUES (?, ?, ?); '

		const page_query = 

			// Set page_id for registered account
			'UPDATE user' +
				' SET page_id = ?' +
				' WHERE id = ?'

		// Execute query and send the result
		try {
			const user_result = await pool.queryTransactionArr(user_query, user_values)
			if (user_result[0].affectedRows === 0) {
				res.status(500).send('')
			}
			else {
				const user_id = user_result[0].insertId
				const check_query = 'SELECT' +
					' EXISTS' +
					' (SELECT * FROM user WHERE page_id = ?)' +
					' AS result'			
				
				let check = true
				while (check) {
					page_id = Math.random().toString(36).substr(2, 11)
					const check_result = await pool.queryParamArr(check_query, [page_id])
					check = (check_result[0][0].result === 1)
				}				

				const values = [provider, user_id, provider_id, page_id, user_id]

				// Generate final version of query string after processing with mysql module
				const query = mysql.format(oauth_query + page_query, values)
				const split_query = query.split(';')
				const result = await pool.queryTransactions.apply(this, split_query)

				for (let i = 0 ; i < result.length ; i++) {
					if (result[i].affectedRows === 0) {
						res.status(500).send('')
						return false
					}
				}
				res.send({
					user_id: user_id
				})
			}
		}

		// Error handling
		catch (e) {
			console.log(e.name + ": " + e.message)
			res.status(500).send(e)
		} 
	}
}


// Set router for user authentication
router.post('/', sendAuthRespond(false))
router.post('/check', sendAuthRespond(false))
router.post('/register', sendRegisterRespond())

// Set router for user authentication
router.post('/artist', sendAuthRespond(true))
router.post('/artist/check', sendAuthRespond(true))

module.exports = router
