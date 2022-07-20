// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond of artwork's metadata
// return function that send metadata of given artwork's id
function sendArtworkMetadataRespond () {
	return async function (req, res, next) {

		// artwork's ID
		const target_id = req.query.target_id
		const values = [target_id]

		// Generate query string by concatenation
		const query = 'SELECT *' +
				' FROM artwork' + 
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

// Send respond for request from artwork
// - target : comment
// return function that send query result with status
function sendArtworkQueryRespond (target) {
	return async function (req, res, next) {

		// artwork's ID
		const target_id = req.query.target_id
		const offset = parseInt(req.query.offset)
		const limit = parseInt(req.query.limit)
		const values = [target_id, offset, limit]

		// Generate query string by concatenation
		const query = (target === 'comment')

			// comment
			? 'SELECT id' +
				' FROM ' + target +
				' WHERE artwork_id = ?' +
				' ORDER BY create_date DESC LIMIT ?, ?'

			// for other target
			: ''

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

// Set router for artwork's metadata
router.get('/', sendArtworkMetadataRespond())

// Set router for comment query
router.get('/comment', sendArtworkQueryRespond('comment'))

module.exports = router
