// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond of artwork's metadata
// return function that send metadata of given artwork's id
function sendArtworkMetadataRespond (is_page) {
	return async function (req, res, next) {

		// artwork's ID
		const target_id = req.query.target_id
		const values = [target_id]

		// Generate query string by concatenation
		const query = (is_page)

			// Initialize page
			? 'SELECT *' +
				' FROM artwork' +
				' WHERE page_id = ?' +
				" AND deleted = b'0'"

			// Initialize minimal data
			: 'SELECT artwork.id as id,' +
				' artwork.name as name,' +
				' user.nickname as nickname' +
				' FROM artwork' +
				' JOIN user ON user.id = artwork.artist_id' +
				' WHERE artwork.page_id = ?' +
				" AND artwork.deleted = b'0'"

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
		const is_comment = target === 'comment'
		
		const offset = (is_comment) ? parseInt(req.query.offset) : null
		const limit = (is_comment) ? parseInt(req.query.limit) : null
		const values = (is_comment) ? [target_id, offset, limit] : [target_id]

		// Generate query string by concatenation
		const query = (is_comment)

			// comment
			? 'SELECT target.id AS id' +
				' FROM ' + target + ' AS target' +
				' JOIN artwork' +
				' ON artwork.id = target.artwork_id' +
				' WHERE artwork.page_id = ?' +
				" AND artwork.deleted = b'0'" +
				" AND target.deleted = b'0'" +
				' ORDER BY target.create_date DESC LIMIT ?, ?'
			
			: ((target === 'exhibition')

				? 'SELECT exhibition.page_id AS page_id' +
					' FROM artwork_list AS target' +
					' INNER JOIN artwork ON target.artwork_id = artwork.id' +
					' INNER JOIN exhibition ON target.exhibition_id = exhibition.id' +
					' WHERE artwork.page_id = ?' +
					" AND artwork.deleted = b'0'" +
					" AND exhibition.deleted = b'0'" +
					' ORDER BY exhibition.create_date'

				// for other target
				: '')

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

// Send respond for posting new artwork
// return function that send post result with status
function sendArtworkPostRespond () {
	return async function (req, res, next) {

		// artist_id, name, year, dimension, material, information, color
		const artist_id = req.body.artist_id
		const name = req.body.name
		const year = req.body.year
		const dimension = req.body.dimension
		const three_dimensional = req.body.three_dimensional
		const material = req.body.material
		const information = req.body.information
		const color = req.body.color
		const is_video = req.body.is_video

		let page_id = ''
		const create_date = new Date()
		const artwork_values = [page_id, artist_id, name, create_date, create_date,
			year, dimension, three_dimensional, material, information, color, is_video]

		// Generate query string by concatenation
		const artwork_query = 

			// Insert artwork information
			'INSERT INTO artwork' +
				' (page_id, artist_id, name, create_date, update_date,' +
				' year, dimension, three_dimensional, material, information, color, is_video)' +
				' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

		const page_query = 

			// Set page_id information
			'UPDATE artwork' +
				' SET page_id = ?' +
				' WHERE id = ?'

		// Execute query and send the result
		try {
			const artwork_result = await pool.queryTransactionArr(artwork_query, artwork_values)
			if (artwork_result[0].affectedRows === 0) {
				res.status(500).send('')
			}
			else {
				const artwork_id = artwork_result[0].insertId
				const check_query = 'SELECT' +
					' EXISTS' +
					' (SELECT * FROM artwork WHERE page_id = ?)' +
					' AS result'			
				
				let check = true
				while (check) {
					page_id = Math.random().toString(36).substr(2, 11)
					const check_result = await pool.queryParamArr(check_query, [page_id])
					check = (check_result[0][0].result === 1)
				} 

				const page_values = [page_id, artwork_id]
				const page_result = await pool.queryTransactionArr(page_query, page_values)
				
				if (page_result[0].affectedRows === 0) {
					res.status(500).send('')
				} else {
					res.send({
						page_id: page_id
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

// Send respond for update artwork's information
// - target : name, information, material, year, dimension
// return function that send update result with status
function sendArtworkUpdateRespond (target) {
	return async function (req, res, next) {

		// artwork's ID, data
		const target_id = req.body.target_id
		const data = req.body.data
		const update_date = new Date()
		const values = [data, update_date, target_id]

		// Generate query string by concatenation
		const query = 

			// name, information, material, year, dimension
			'UPDATE artwork' +
				' SET ' + target + ' = ?,' +
					' update_date = ?' +
				' WHERE id = ?' +
				" AND deleted = b'0'"

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

// Send respond for deleting pre-artwork's information
// return function that send deletion result with status
function sendArtworkDeleteRespond () {
	return async function (req, res, next) {

		// artwork's ID
		const target_id = req.query.target_id
		const registered = JSON.parse(req.query.registered)
		const values = [target_id]

		// Generate query string by concatenation
		const query = (registered)
			
			? 'UPDATE artwork' +
				" SET deleted = b'1'" +
				' WHERE page_id = ?'

			: 'DELETE FROM artwork' +
				' WHERE page_id = ?'

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

// Set router for artwork's metadata
router.get('/', sendArtworkMetadataRespond(false))
router.get('/page', sendArtworkMetadataRespond(true))

// Set router for comment query
router.get('/comment', sendArtworkQueryRespond('comment'))
router.get('/exhibition', sendArtworkQueryRespond('exhibition'))

// Set router for posting new artwork
router.post('/', sendArtworkPostRespond())

// Set router for deleting pre-artwork
router.delete('/', sendArtworkDeleteRespond())

// Set router for update existing artwork
router.put('/name', sendArtworkUpdateRespond('name'))
router.put('/information', sendArtworkUpdateRespond('information'))
router.put('/material', sendArtworkUpdateRespond('material'))
router.put('/year', sendArtworkUpdateRespond('year'))
router.put('/dimension', sendArtworkUpdateRespond('dimension'))
router.put('/three_dimensional', sendArtworkUpdateRespond('three_dimensional'))
router.put('/is_video', sendArtworkUpdateRespond('is_video'))
router.put('/color', sendArtworkUpdateRespond('color'))

module.exports = router
