// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond of comment's metadata
// return function that send metadata of given comment's id
function sendCommentMetadataRespond () {
	return async function (req, res, next) {

		// comment's ID
		const target_id = req.query.target_id
		const values = [target_id]

		// Generate query string by concatenation
		const query = 'SELECT *' +
				' FROM comment' + 
				' WHERE id = ?' +
				" AND deleted = b'0'"

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

// Insert new comment from request
// return function that sends comment's id if transaction has been successful, empty string if not
function sendCommentInsertRespond () {
	return async function (req, res, next) {

		// body, user_id, artwork_id
		const user_id = req.body.user_id
		const artwork_id = req.body.artwork_id
		const body = req.body.body
		const create_date = new Date()
		const remote_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const values = [user_id, artwork_id, body, create_date, remote_addr, remote_addr]

		// Generate query string by concatenation
		const query = 'INSERT INTO comment' +
				' (user_id, artwork_id, body, create_date, create_ip, last_update_ip)' + 
				' VALUES (?, ?, ?, ?, ?, ?)'

		// Execute query and send the result
		try {
			const result = await pool.queryTransactionArr(query, values)
			if (result[0].affectedRows === 0) {
				res.status(500).send('')
			} 
			else {
				res.send({
					comment_id: result[0].insertId
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

// Delete comment from request
// return function that sends true if transaction has been successful, false if not
function sendCommentDeleteRespond () {
	return async function (req, res, next) {

		// user_id, comment_id
		const user_id = req.body.user_id
		const comment_id = req.body.comment_id
		const values = [user_id, comment_id]	

		// Generate query string by concatenation
		const query = 'UPDATE comment' +
				" SET deleted = b'1'" +
				' WHERE user_id = ? AND id = ?'

		// Execute query and send the result
		try {
			const result = await pool.queryTransactionArr(query, values)
			if (result[0].affectedRows === 0) {
				res.status(404).send(false)
			} 
			else {
				res.send(true)
			}
		}

		// Error handling
		catch (e) {
			console.log(e.name + ": " + e.message)
			res.status(500).send(e)
		}
	}
}



// Set router for comment's metadata
router.get('/', sendCommentMetadataRespond())

// Set router for comment insertion
router.post('/', sendCommentInsertRespond())

// Set router for comment deletion
router.put('/', sendCommentDeleteRespond())

module.exports = router
