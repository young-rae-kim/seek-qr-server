var express = require('express');
var router = express.Router();
var pool = require('../modules/pool');

router.get('/artwork', async function(req, res, next) {
	const replyAwpid = req.query.awpid;
	const query = "SELECT * FROM artworkReply WHERE awpid = ? AND deletedDate IS NULL ORDER BY writtenDate";
	const values = [replyAwpid];

	try {
		const result = await pool.queryParamArr(query, values);
		if (result[0].length == 0) {
			res.status(404).send([]);
		} else {
			res.status(200).send(result);
		}
	} catch (e) {
		console.log(e.name + ": " + e.message);
		res.status(500).send(e);
	}
});

router.post('/artwork', async function(req, res, next) {
	var previousIncrement = [];
	const incrementQuery = 'SELECT MAX(arid) as arid FROM artworkReply';

	try {
		const incrementResult = await pool.queryParam(incrementQuery);
		if(incrementResult[0][0].arid) {
			previousIncrement.push(incrementResult[0][0].arid + 1);
		} else {
			previousIncrement.push(10000);
		}
	} catch (e) {
		console.log(e.name + ": " + e.message);
		res.status(500).send(e);
	}

	const replyData = await req.body;
	const replyIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	const replyDate = new Date();
	const replyParentArid = replyData.parentARID;
	const replyAwpid = replyData.awpid;
	const replyUpid = replyData.upid;
	const replyBody = replyData.body;
	const replyIsArtist = replyData.isArtist;

	const questions = "?, ?, ?, ?, ?, ?, ?";
	const fields = "createIP, writtenDate, parentARID, awpid, writerUPID, body, isArtist";
	const values = [replyIP, replyDate, replyParentArid, replyAwpid, replyUpid, replyBody, replyIsArtist];
	const query = "INSERT INTO artworkReply ( " + fields + " ) VALUES( " + questions + " )";

	try {
		const result = await pool.queryTransactionArr(query, values);
		let respond = new Object();
		respond.result = result;
		respond.arid = previousIncrement[0];
		res.send(respond);
	} catch (e) {
		const revertQuery = 'ALTER TABLE artworkReply AUTO_INCREMENT = ?';
		const revertResult = await pool.queryTransactionArr(revertQuery, previousIncrement);

		console.log(e.name + ": " + e.message);
		res.status(500).send(e);
	}
});

module.exports = router;
