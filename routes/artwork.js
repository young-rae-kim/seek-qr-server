// Deploying express and its router, Fetching modules for database via mysql
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')
var sha3_224 = require('js-sha3').sha3_224

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
				' WHERE page_id = ?' +
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
				" AND deleted = b'0'" +
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

// Send respond for posting new artwork
// return function that send post result with status
function sendArtworkPostRespond () {
	return async function (req, res, next) {

		// artist_id, name, year, dimension, material, information, color
		const artist_id = req.body.artist_id
		const name = req.body.name
		const year = req.body.year
		const dimension = req.body.dimension
		const material = req.body.material
		const information = req.body.information
		const color = req.body.color

		let page_id = ''
		const create_date = new Date()
		const artwork_values = [page_id, artist_id, name, create_date, create_date,
			year, dimension, material, information, color]

		// Generate query string by concatenation
		const artwork_query = 

			// Insert artwork information
			'INSERT INTO artwork' +
				' (page_id, artist_id, name, create_date, update_date,' +
				' year, dimension, material, information, color)' +
				' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

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
				const bytes = sha3_224(String(artwork_id))
				for (let i = 0 ; i < bytes.byteLength ; i++) {
					page_id += String.fromCharCode(bytes[i])
				}
				page_id = window.btoa(page_id)

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

// Set router for artwork's metadata
router.get('/', sendArtworkMetadataRespond())

// Set router for comment query
router.get('/comment', sendArtworkQueryRespond('comment'))

// Set router for posting new artwork
router.post('/', sendArtworkPostRespond('artwork'))

// Set router for update existing artwork
router.put('/name', sendArtworkUpdateRespond('name'))
router.put('/information', sendArtworkUpdateRespond('information'))
router.put('/material', sendArtworkUpdateRespond('material'))
router.put('/year', sendArtworkUpdateRespond('year'))
router.put('/dimension', sendArtworkUpdateRespond('dimension'))

module.exports = router
