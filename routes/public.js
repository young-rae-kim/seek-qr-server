// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for request from public access
// - target : advertisement, trending_artist
// return function that send query result with status
function sendPublicQueryRespond (target) {
	return async function (req, res, next) {

		// Generate query string by concatenation
		const query = (target === 'advertisement')

			// advertisement
			? 'SELECT page_id' +
				' FROM ' + target

			// trending_artist
			: 'SELECT page_id' + 
				' FROM artist_page' +
				' ORDER BY rand() LIMIT 10'

		// Execute query and send the result
		try {
			const result = await pool.queryParam(query, values)
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
router.get('/advertisement', sendPublicQueryRespond('advertisement'))
router.get('/trending_artist', sendPublicQueryRespond('trending_artist'))

module.exports = router
