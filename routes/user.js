// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for request from user
// - target : bookmark, follower, following
// return function that send query result with status
function sendUserQueryRespond (target) {
	return async function (req, res, next) {

		// user's page ID, offset, limit
		const target_page_id = req.query.target_page_id
		const offset = parseInt(req.query.offset)
		const limit = parseInt(req.query.limit)
		const values = [target_page_id, offset, limit]

		// Switch target variable for follower query
		const select_target = null
		const clause_target = null
		if (target === 'follower') {
			select_target = 'follower_id'
			clause_target = 'user_id'
		}
		else if (target === 'following') {
			select_target = 'user_id'
			clause_target = 'follower_id'
		}

		// Generate query string by concatenation
		const query = (target === 'bookmark_artwork')

			// bookmark
			? 'SELECT artwork_id' +
				' FROM ' + target +
				' JOIN user_page USING (user_id)' +
				' WHERE page_id = ? ORDER BY create_date LIMIT ?, ?'

			// follower, following
			: 'SELECT ' + select_target + 
				' FROM follow_user' +
				' JOIN user_page' +
				' ON follow_user.' + clause_target + ' = user_page.user_id' +
				' WHERE page_id = ? ORDER BY create_date LIMIT ?, ?'

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
router.get('/bookmark', sendUserQueryRespond('bookmark_artwork'))
router.get('/follower', sendUserQueryRespond('follower'))
router.get('/following', sendUserQueryRespond('following'))
router.get('/recommend', sendUserQueryRespond('bookmark_artwork'))

module.exports = router
