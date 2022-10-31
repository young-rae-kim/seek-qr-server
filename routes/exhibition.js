// Deploying express and its router, Fetching modules for database via mysql
var mysql = require('mysql')
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond of exhibition's metadata
// return function that send metadata of given exhibition's id
function sendExhibitionMetadataRespond (is_page, list_type) {
	return async function (req, res, next) {

		// exhibition's page ID
		const target_id = req.query.target_id
		const values = [target_id]

		// Generate query string by concatenation
		let query 

		switch (list_type) {
			
			case 'category':
				query = 'SELECT artwork.page_id as page_id, target.category as category' +
					' FROM artwork_list as target' +
					' INNER JOIN exhibition ON exhibition.id = target.exhibition_id' +
					' INNER JOIN artwork ON artwork.id = target.artwork_id' +
					' WHERE exhibition.page_id = ?' +
					" AND exhibition.deleted = b'0'" +
					" AND artwork.deleted = b'0'" +
					' ORDER BY target.access_date'
				break

			case 'collaborator':
				query = 'SELECT target.artist_id as id' +
					' FROM exhibition_collaborator as target' +
					' JOIN exhibition' +
					' ON exhibition.id = target.exhibition_id' +
					' WHERE exhibition.page_id = ?' +
					" AND exhibition.deleted = b'0'"
				break

			case 'location':
				query = 'SELECT target.latitude as latitude, target.longitude as longitude, target.location_id as location_id' +
					' FROM location as target' +
					' JOIN exhibition' +
					' ON exhibition.id = target.exhibition_id' +
					' WHERE exhibition.page_id = ?' +
					" AND exhibition.deleted = b'0'"
				break

			default:
				query = (is_page)

					? 'SELECT *' +
						' FROM exhibition' +
						' WHERE page_id = ?' +
						" AND deleted = b'0'"
			
					: 'SELECT exhibition.id as id,' +
						' exhibition.name as name,' +
						' exhibition.start_date as start_date,' +
						' exhibition.end_date as end_date,' +
						' user.nickname as nickname' +
						' FROM exhibition' +
						' JOIN user ON user.id = exhibition.owner_id' +
						' WHERE exhibition.page_id = ?' +
						" AND exhibition.deleted = b'0'"
				break
		}

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

// Send respond for posting new exhibition
// return function that send post result with status
function sendExhibitionPostRespond () {
	return async function (req, res, next) {

		// owner_id, name, information
		const owner_id = req.body.owner_id
		const name = req.body.name
		const information = req.body.information
		const is_video = req.body.is_video

		let page_id = ''
		const create_date = new Date()
		const start_date = req.body.start_date
		const end_date = req.body.end_date
		const exhibition_values = [page_id, owner_id, name, create_date, create_date, start_date, end_date, information, is_video]

		// Generate query string by concatenation
		const exhibition_query = 

			// Insert exhibition information
			'INSERT INTO exhibition' +
				' (page_id, owner_id, name, create_date, update_date, start_date, end_date, information, is_video)' +
				' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'

		const page_query = 

			// Set page_id information
			'UPDATE exhibition' +
				' SET page_id = ?' +
				' WHERE id = ?'

		// Execute query and send the result
		try {
			const exhibition_result = await pool.queryTransactionArr(exhibition_query, exhibition_values)
			if (exhibition_result[0].affectedRows === 0) {
				res.status(500).send('')
			}
			else {
				const exhibition_id = exhibition_result[0].insertId
				const check_query = 'SELECT' +
					' EXISTS' +
					' (SELECT * FROM exhibition WHERE page_id = ?)' +
					' AS result'			
				
				let check = true
				while (check) {
					page_id = Math.random().toString(36).substr(2, 11)
					const check_result = await pool.queryParamArr(check_query, [page_id])
					check = (check_result[0][0].result === 1)
				} 

				const page_values = [page_id, exhibition_id]
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

function sendExhibitionListRespond (target) {
	return async function (req, res, next) {

		// link information
		const is_link = target === 'link'
		const exhibition_id = req.body.target_id
		const link_information = (is_link) ? req.body.data : {}
		const artist_id = (is_link) ? '' : req.body.data

		const access_date = new Date()
		const remote_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress 

		// Generate query string by concatenation
		let query = (is_link)

			// Insert exhibition information
			? 'UPDATE exhibition SET link =' 

			: 'INSERT INTO exhibition_collaborator' +
				' (exhibition_id, artist_id, access_date, remote_addr)' +
				' VALUES (?, ?, ?, ?)'

		// Execute query and send the result
		try {
			let result

			if (is_link) {

				const values = []

				if (!link_information) {
					query += ' ?'
					values.push(null)
				}
				else {
					const keys = Object.keys(link_information)

					query += ' JSON_OBJECT ('
					for (let i = 0; i < keys.length; i++) {
						if (i == keys.length - 1) {
							query += ' ?, ?)'
						}
						else {
							query += ' ?, ?,'
						}

						values.push(keys[i])
						values.push(link_information[keys[i]])
					}
				}
				
				query += ' WHERE id = ?'
				values.push(exhibition_id)

				result = await pool.queryTransactionArr(query, values)
			}
			else {
				const values = [exhibition_id, artist_id, access_date, remote_addr]
				result = await pool.queryTransactionArr(query, values)
			}

			if (!result || result[0].affectedRows === 0) {
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

// Send respond for update exhibition's information
// - target : name, information, category, is_video
// return function that send update result with status
function sendExhibitionUpdateRespond (target) {
	return async function (req, res, next) {

		// exhibition's ID, data
		const target_id = req.body.target_id
		const data = req.body.data
		const update_date = new Date()
		const values = [data, update_date, target_id]

		// Generate query string by concatenation
		const query = 

			// name, information, material, year, dimension
			'UPDATE exhibition' +
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

function sendExhibitionCategoryRespond () {
	return async function (req, res, next) {

		// exhibition's ID, data
		const target_id = req.body.target_id
		const category = req.body.category
		const artwork = req.body.artwork
		let interval = 0
		const values = [target_id]

		let query = 'DELETE FROM artwork_list' +
			' WHERE exhibition_id = ?'

		const insert_query = '; INSERT INTO artwork_list' +
			' (exhibition_id, artwork_id, access_date, category)' +
			' VALUES (?, ?, ?, ?)'
		
		if (category && artwork) {
			const json_length = category.length
			for (let i = 0; i < json_length; i++) {
				let update_date = new Date()
				update_date.setMilliseconds(update_date.getMilliseconds() + interval++)
				query += insert_query
				values.push(target_id, artwork[i], update_date, category[i])
			}
		}

		const category_query = mysql.format(query, values)
		const split_query = category_query.split(';')

		// Execute query and send the result
		try {
			const result = await pool.queryTransactionsAsync.apply(this, split_query)
			
			for (let i = 1; i < result.length; i++) {
				if (result[i].affectedRows === 0) {
					res.status(500).send(false)
					return false
				}
			}
			res.send(true)
		}

		// Error handling
		catch (e) {
			console.log(e.name + ": " + e.message)
			res.status(500).send(e)
		}
	}
}

function sendExhibitionAreaRespond () {
	return async function (req, res, next) {
		const area = req.body.area
		const offset = req.body.offset
		const limit = req.body.limit
		const values = [area, offset, limit]

		const query = 'SELECT exhibition.page_id as page_id' +
			' FROM location' +
			' JOIN exhibition ON exhibition.id = location.exhibition_id' +
			' WHERE location.area LIKE ?' +
			" AND exhibition.deleted = b'0'" +
			' LIMIT ?, ?'

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

// Send respond for deleting pre-exhibition's information
// return function that send deletion result with status
function sendExhibitionDeleteRespond (target) {
	return async function (req, res, next) {

		// exhibition's ID
		const target_id = req.query.target_id
		const page_id = (target) ? req.query.page_id : ''
		const registered = (target) ? false : JSON.parse(req.query.registered)
		const values = (target) ? [target_id, page_id] : [target_id]

		// Generate query string by concatenation
		const query = (target === 'collaborator')

				? 'DELETE target FROM exhibition_collaborator AS target' +
					' INNER JOIN user ON user.id = target.artist_id' +
					' INNER JOIN exhibition ON exhibition.id = target.exhibition_id' +
					' WHERE exhibition.page_id = ?' +
					' AND user.page_id = ?'
			
				: ((registered)
			
					? 'UPDATE exhibition' +
						" SET deleted = b'1'" +
						' WHERE page_id = ?'
	
					: 'DELETE FROM exhibition' +
						' WHERE page_id = ?')

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

// Set router for exhibition's metadata
router.get('/', sendExhibitionMetadataRespond(false, null))
router.get('/page', sendExhibitionMetadataRespond(true, null))
router.get('/collaborator', sendExhibitionMetadataRespond(false, 'collaborator'))
router.get('/category', sendExhibitionMetadataRespond(false, 'category'))
router.get('/location', sendExhibitionMetadataRespond(false, 'location'))

// Set router for exhibition's registration
router.post('/', sendExhibitionPostRespond())
router.post('/link', sendExhibitionListRespond('link'))
router.post('/collaborator', sendExhibitionListRespond('collaborator'))
router.post('/area', sendExhibitionAreaRespond())

// Set router for exhibition's update
router.put('/name', sendExhibitionUpdateRespond('name'))
router.put('/information', sendExhibitionUpdateRespond('information'))
router.put('/category', sendExhibitionCategoryRespond())
router.put('/date/start', sendExhibitionUpdateRespond('start_date'))
router.put('/date/end', sendExhibitionUpdateRespond('end_date'))
router.put('/is_video', sendExhibitionUpdateRespond('is_video'))

// Set router for exhibition's deletion
router.delete('/', sendExhibitionDeleteRespond(null))
router.delete('/collaborator', sendExhibitionDeleteRespond('collaborator'))

module.exports = router
