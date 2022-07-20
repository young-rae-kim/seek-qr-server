// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for authentication
// return function that send query result with status
function sendAuthRespond () {
	return async function (req, res, next) {

		// provider and its ID
		const provider = req.body.provider
		const provider_id = req.body.provider_id
		const values = [provider, provider_id]

		// Generate query string by concatenation
		const query = 

			// Search user_id for given authentication information
			'SELECT user_id' + 
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

// Send respond for checking given account
// return function that send query result with status
function sendCheckRespond () {
	return async function (req, res, next) {

		// provider, id
		const provider = req.body.provider
		const provider_id = req.body.provider_id
		const values = [provider, provider_id]

		// Generate query string by concatenation
		const query = 

			// Search user_id for given authentication information
			'SELECT user_id' + 
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

// Send respond for update (OAuth2 information)
// return function that send query result with status
function sendRefreshRespond () {
	return async function (req, res, next) {

		// user_id, access_token, provider
		const user_id = req.body.user_id
		const provider = req.body.provider
		const access_token = req.body.access_token
		const values = [access_token, user_id, provider]

		// Generate query string by concatenation
		const query = 

			// Update OAuth2 information
			'UPDATE oauth' +
				' SET access_token = ?' +
				' WHERE user_id = ?' +
				' AND provider = ?'

		// Execute query and send the result
		try {
			const result = await pool.queryTransactionArr(query, values)
			if (result[0].affectedRows === 0) {
				res.status(404).send('')
			}
			else {
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

// Send respond for registeration (OAuth2 information)
// return function that send query result with status
function sendRegisterRespond () {
	return async function (req, res, next) {

		// access_token, provider
		const provider = req.body.provider
		const provider_id = req.body.provider_id
		const nickname = req.body.nickname
		const access_token = req.body.access_token

		const create_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const create_date = new Date()
		const user_values = [nickname, create_ip, create_date]

		// Generate query string by concatenation
		const user_query = 

			// Insert user information
			'INSERT INTO user' +
				' (nickname, create_ip, create_date)' +
				' VALUES (?, ?, ?)'

		const oauth_query = 

			// Insert OAuth2 information
			'INSERT INTO oauth' +
				' (provider, user_id, access_token, provider_id)' +
				' VALUES (?, ?, ?, ?)'

		// Execute query and send the result
		try {
			const user_result = await pool.queryTransactionArr(user_query, user_values)
			if (user_result[0].affectedRows === 0) {
				res.status(500).send('')
			}
			else {
				const user_id = user_result[0].insertId
				const oauth_values = [provider, user_id, access_token, provider_id]
				const oauth_result = await pool.queryTransactionArr(oauth_query, oauth_values)
				
				if (oauth_result[0].affectedRows === 0) {
					res.status(500).send('')
				} else {
					res.send({
						user_id: user_id
					})
				}
			}
		}

		// Error handling
		catch (e) {
			console.log(e.name + ": " + e.message)
			res.status(500).send(e)
		} 
	}
}


// Set router for metadata query (user, artist, person, artwork)
router.post('/', sendAuthRespond())
router.post('/check', sendCheckRespond())
router.post('/refresh', sendRefreshRespond())
router.post('/register', sendRegisterRespond())

module.exports = router
