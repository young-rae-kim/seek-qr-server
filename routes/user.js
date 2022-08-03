// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for request from user
// - target : user, history, archive
// return function that send query result with status
function sendUserQueryRespond (target) {
	return async function (req, res, next) {

		// for user's metadata
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
			? 'SELECT nickname, page_id, sns' +
				' FROM ' + target +
				' WHERE id = ?' +
				" AND account_expired = b'0'" +
				" AND account_locked = b'0'" +
				" AND withdrawn = b'0'"

			// history, archive
			: 'SELECT artwork.page_id as page_id' + 
				' FROM ' + target + ' as target' +
				' JOIN artwork' +
				' ON artwork.id = target.artwork_id' +
				' WHERE target.user_id = ?' +
				' AND target.artwork_id NOT IN (' +
					"SELECT id FROM artwork WHERE deleted = 1)" +
				' ORDER BY target.access_date DESC LIMIT ?, ?'

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

// Set router for metadata query (user, artist, person, artwork)
router.post('/', sendUserQueryRespond('user'))
router.post('/history', sendUserQueryRespond('history'))
router.post('/archive', sendUserQueryRespond('archive'))

module.exports = router
