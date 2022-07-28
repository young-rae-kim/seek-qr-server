// Deploying express and its router, Fetching modules for storage via s3
var express = require('express')
var router = express.Router()
var loader = require('../modules/loader')

// Send respond for storage file's url (user, artist, artwork, advertisement)
// - type : 'image', 'video', 'file'
// - target : 'user', 'artist', 'artwork', 'advertisement', 'blog'
// - sub-target : 'profile', 'background', 'represent', 'all' or 'original'
// return the url string, error if exception has been raised
function sendSignedUrlRespond (type, target, sub_target) {
	return async function (req, res, next) {

		// user, artist, artwork or advertisement
		const target_id = req.query.target_id
		var directory = (target === 'advertisement')
			? 'asset/'
			: '' 

		// Generate query string by concatenation
		if (type === 'image') {
			switch (target) {
				case 'user' :
				case 'artist' :
				case 'advertisement' :
					directory += 
						target + '/' + target_id + '/' + sub_target + '.jpg'
					break

				case 'artwork' :
				case 'blog' :
					directory += 
						target + '/' + target_id + '/'
					if (sub_target === 'represent') {
						directory += '0.jpg'
					}
					else if (sub_target === 'thumbnail') {
						directory += 'thumbnail/thumbnail.jpg'
					}
					break

			}
		}
		
		// Execute load from s3 and send the result
		try {
			const url_result = (sub_target === 'all' 
				|| sub_target === 'original')
				? await loader.getSignedUrlList(directory)
				: await loader.getSignedUrl(directory)
			res.send(url_result)
		}

		// Error handling
		catch (e) {
			console.log(e.name + ': ' + e.message)
			res.send(e)
		}
	}
}

// Set router for request on image's signed url (user, artist, artwork, advertisement)
router.get('/image/artwork/all', sendSignedUrlRespond('image', 'artwork', 'all'))
router.get('/image/artwork/thumbnail', sendSignedUrlRespond('image', 'artwork', 'thumbnail'))
router.get('/image/artwork/represent', sendSignedUrlRespond('image', 'artwork', 'represent'))
// router.get('/image/user/profile', sendSignedUrlRespond('image', 'user', 'profile'))
// router.get('/image/artist/profile', sendSignedUrlRespond('image', 'artist', 'profile'))
// router.get('/image/artist/background', sendSignedUrlRespond('image', 'artist', 'background'))
// router.get('/image/blog/all', sendSignedUrlRespond('image', 'blog', 'all'))
// router.get('/image/advertisement/background', sendSignedUrlRespond('image', 'advertisement', 'background'))

module.exports = router
