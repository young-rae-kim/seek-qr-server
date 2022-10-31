// Deploying express and its router, Fetching modules for database via mysql
var mysql = require('mysql')
var express = require('express')
var router = express.Router()
var pool = require('../modules/pool')

// Send respond for query events (isHistory, isArchived, isLiked)
// - type : 'history', 'archive', 'like_comment'
// - target : 'artwork', 'comment'
// return function that sends true if any row has been queryed, false if result is empty (404)
function sendEventQueryRespond (type, target) {
	return async function (req, res, next) {
		
		// artwork or comment
		const target_id = req.body.target_id
		const user_id = req.body.user_id
		const values = [target_id, user_id]

		// artwork_id, comment_id
		const target_column_name = target + "_id"

		// Generate query string by concatenation
		const query = 

			// history, archive, like
			'SELECT *' + 
				' FROM ' + type +
				' WHERE ' + target_column_name + ' = ?' +
				' AND user_id = ?'
		
		// Execute query and check the result
		try {
			const result = await pool.queryParamArr(query, values)
			if (result[0].length === 0) {
				res.send(false)
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

// Send respond for transaction (insert) events (doHistory, doArchive, doLike, doSession)
// - type : 'archive', 'like_comment', 'history', 'session'
// - target : 'artwork', 'comment', 'user'
// return function that sends true if transaction has been successful, false if not
function sendEventInsertRespond (type, target) {
	return async function (req, res, next) {
		
		// session
		const is_session = type === 'session'

		// artwork or comment
		const target_id = (is_session) ? req.body.user_id : req.body.target_id
		const user_id = req.body.user_id
		const access_date = new Date()
		const remote_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const values = (is_session)
			? [user_id, access_date, remote_addr, target_id]
			: [target_id, user_id, access_date, remote_addr, target_id]
		
		// artwork_id, comment_id
		const target_column_name = target + '_id'
		const count_column_name = type.split('_')[0] + '_count'

		// Generate query string for insertion (or deletion)
		const insert_query = (is_session)

			// session
			? 'INSERT INTO ' + type +
				' (user_id, access_date, remote_addr)' +
				' VALUES (?, ?, ?); '
			
			// archive, like, history
			: 'INSERT INTO ' + type +
				' (' + target_column_name + ', user_id, access_date, remote_addr)' +
				' VALUES (?, ?, ?, ?); '

		// Generate query string for count modification
		const count_query = 

			// archive, like, session
			'UPDATE ' + target +
				' SET ' + count_column_name +
					' = ' + count_column_name + ' + 1' +
				' WHERE id = ?'

		// Generate final version of query string after processing with mysql module
		const query = mysql.format(insert_query + count_query, values) 
		const split_query = query.split(';')

		// Execute query and send the result
		try {
			const result = await pool.queryTransactions.apply(this, split_query)
			for (let i = 0 ; i < result.length ; i++) {
				if (result[i].affectedRows === 0) {
					res.send(false)
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

// Send respond for transaction (delete) events (doArchive, doLike)
// - type : 'archive', 'like_comment'
// - target : 'artwork', 'comment'
// return function that sends true if transaction has been successful, false if not
function sendEventDeleteRespond (type, target) {
	return async function (req, res, next) {
		
		// artwork or comment
		const target_id = req.body.target_id
		const user_id = req.body.user_id
		const access_date = new Date()
		const remote_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const values = [target_id, user_id, target_id]
		
		// artwork_id, comment_id
		const target_column_name = target + '_id'
		const count_column_name = type.split('_')[0] + '_count'		
		
		// Generate query string for insertion (or deletion)
		const delete_query =

			// archive, like
			'DELETE FROM ' + type +
				' WHERE ' + target_column_name + ' = ?' +
				' AND user_id = ?; '

		// Generate query string for count modification
		const count_query = 

			// archive, like, session
			'UPDATE ' + target +
				' SET ' + count_column_name +
					' = ' + count_column_name + ' - 1' +
				' WHERE id = ?'

		// Generate final version of query string after processing with mysql module
		const query = mysql.format(delete_query + count_query, values) 
		const split_query = query.split(';')

		// Execute query and send the result
		try {
			const result = await pool.queryTransactions.apply(this, split_query)
			for (let i = 0 ; i < result.length ; i++) {
				if (result[i].affectedRows === 0) {
					res.send(false)
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

// Send respond for transaction (update) events (updateHistory)
// - type : 'history'
// - target : 'artwork'
// return function that sends true if transaction has been successful, false if not
function sendEventUpdateRespond (type, target) {
	return async function (req, res, next) {
		
		// artwork
		const target_id = req.body.target_id
		const user_id = req.body.user_id
		const access_date = new Date()
		const remote_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const values = [access_date, remote_addr, target_id, user_id]
		
		// artwork_id, comment_id
		const target_column_name = target + '_id'

		// Generate query string for update
		const query = 
			
			// history
			'UPDATE ' + type +
				' SET access_date = ?, remote_addr = ?' +
				' WHERE ' + target_column_name + ' = ?' +
				' AND user_id = ?'

		// Execute query and send the result
		try {
			const result = await pool.queryTransactionArr(query, values)
			if (result[0].affectedRows === 0) {
				res.send(false)
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

// Set router for event query (isLiked, isArchived, isHistory)
router.post('/user/like/comment', sendEventQueryRespond('like_comment', 'comment'))
router.post('/user/archive/artwork', sendEventQueryRespond('archive_artwork', 'artwork'))
router.post('/user/archive/exhibition', sendEventQueryRespond('archive_exhibition', 'exhibition'))
router.post('/user/history/exhibition', sendEventQueryRespond('history', 'exhibition'))

// Set router for transaction (insert) query (doLike, doArchive, doHistory, doSession)
router.post('/like/comment', sendEventInsertRespond('like_comment', 'comment'))
router.post('/archive/artwork', sendEventInsertRespond('archive_artwork', 'artwork'))
router.post('/archive/exhibition', sendEventInsertRespond('archive_exhibition', 'exhibition'))
router.post('/history/exhibition', sendEventInsertRespond('history', 'exhibition'))
router.post('/session', sendEventInsertRespond('session', 'user'))

// Set router for transaction (delete) query (doLike, doArchive)
router.put('/like/comment', sendEventDeleteRespond('like_comment', 'comment'))
router.put('/archive/artwork', sendEventDeleteRespond('archive_artwork', 'artwork'))
router.put('/archive/exhibition', sendEventDeleteRespond('archive_exhibition', 'exhibition'))
router.put('/history/exhibition', sendEventUpdateRespond('history', 'exhibition'))

module.exports = router
