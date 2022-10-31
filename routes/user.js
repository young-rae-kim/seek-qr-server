// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for request from user
// - target : user, history, archive
// return function that send query result with status
function sendUserQueryRespond (target, type) {
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

			// archive or history
			: 'SELECT ' + type + '.page_id as page_id' + 
				' FROM ' + target + ' as target' +
				' JOIN ' + type +
				' ON ' + type + '.id = target.' + type + '_id' +
				' WHERE target.user_id = ?' +
				' AND target.' + type + '_id NOT IN (' +
					"SELECT id FROM " + type + " WHERE deleted = 1)" +
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

function sendUserRandomRespond(target) {
	return async function (req, res, next) {

		const is_artwork = (target === 'artwork')
		const seed = req.query.seed
		const offset = parseInt(req.query.offset)
		const limit = parseInt(req.query.limit)
		const values = [seed, offset, limit]

		const query = (is_artwork)

			? 'SELECT page_id' +
				' FROM artwork' +
				' WHERE (id > 10000324 AND id < 10000345)' +
				' OR (id > 10000039 AND id < 10000070)' +
				" AND deleted = b'0'" +
				' ORDER BY RAND(?)' +
				' LIMIT ?, ?'

			: ''

		try {
			const result = await pool.queryParamArr(query, values)
			if (result[0].length === 0) {
				res.status(404).send(result)
			}
			else {
				res.send(result)
			}
		}

		catch (e) {
			console.log(e.name + ": " + e.message)
			res.status(500).send(e)
		}

	}
}

// Set router for metadata query (user, artist, person, artwork)
router.post('/', sendUserQueryRespond('user', ''))
router.post('/history', sendUserQueryRespond('history', 'exhibition'))
router.post('/archive/artwork', sendUserQueryRespond('archive_artwork', 'artwork'))
router.post('/archive/exhibition', sendUserQueryRespond('archive_exhibition', 'exhibition'))
router.get('/random/artwork', sendUserRandomRespond('artwork'))

module.exports = router
