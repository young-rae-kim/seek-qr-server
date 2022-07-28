// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for request from artist
// - target : user, artwork
// return function that send query result with status
function sendArtistQueryRespond (target) {
	return async function (req, res, next) {

		// for artist's metadata
		const is_user = (target === 'user')

		// user's ID, offset, limit
		const target_id = req.body.target_id
		const offset = (is_user) ? 0 : parseInt(req.body.offset)
		const limit = (is_user) ? 0 : parseInt(req.body.limit)
		const values = (is_user)
			? [target_id]
			: [target_id, offset, limit]

		// Generate query string by concatenation
		const query = (is_user)

			// user
			? 'SELECT nickname, sns, page_id' +
				' FROM ' + target +
				' WHERE id = ?' +
				" AND account_expired = b'0'" +
				" AND account_locked = b'0'" +
				" AND withdrawn = b'0'"

			// artwork
			: 'SELECT page_id' + 
				' FROM ' + target +
				' WHERE artist_id = ?' +
				" AND deleted = b'0'" +
				' ORDER BY create_date DESC LIMIT ?, ?'

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

// Send respond for update from artist
// - target : nickname, sns
// return function that send update result with status
function sendArtistUpdateRespond (target) {
	return async function (req, res, next) {

		// user's ID, data
		const target_id = req.body.target_id
		const data = req.body.data
		const values = [data, target_id]

		// Generate query string by concatenation
		const query = 

			// nickname, sns
			'UPDATE user' +
				' SET ' + target + ' = ?'
				' WHERE id = ?' +
				" AND account_expired = b'0'" +
				" AND account_locked = b'0'" +
				" AND withdrawn = b'0'"

		// Execute query and send the result
		try {
			const result = await pool.queryTransactionArr(query, values)
			if (result[0].affectedRows === 0) {
				res.status(500).send(false)
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

// Set router for metadata query (user, artist, person, artwork)
router.post('/', sendArtistQueryRespond('user'))
router.post('/artwork', sendArtistQueryRespond('artwork'))

// Set router for information update (nickname, sns)
router.put('/nickname', sendArtistUpdateRespond('nickname'))
router.put('/sns', sendArtistUpdateRespond('sns'))

module.exports = router
