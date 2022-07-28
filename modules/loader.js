var s3 = require('../config/storage');

// const multer = require('multer-s3');
// const multerUploader = multer({
// 	s3: s3,
// 	bucket: 'seek-customer-storage',
// 	acl: 'public-read',
// });

var cfsign = require('aws-cloudfront-sign');
var signingParams = require('../config/cloudfront');

module.exports = {

	// Fetch object from s3 bucket
	getObject: async (directory) => {
		return new Promise (async (resolve, reject) => {
			try {
				const params = {
					Bucket: 'seek-customer-storage',
					Key: directory
				};

				s3.getObject(params, (err, data) => {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	},

	// Get signed url for object from s3 bucket
//	getSignedUrl: async (directory) => {
//		return new Promise (async (resolve, reject) => {
//			try {
//				const signedUrl = await cfsign.getSignedUrl(
//					'http://d3046nlf9waumu.cloudfront.net/' + directory,
//					signingParams
//				);
//				resolve(signedUrl);
//
//			} catch (e) {
//				reject(e);
//			}
//		});
//	},

	// Get list of signed url for objects in given directory
//	getSignedUrlList: async (directory) => {
//		return new Promise (async (resolve, reject) => {
//			try {
//				const params = {
//					Bucket: 'seek-customer-storage',
//					Prefix: directory,
//					Delimiter: '/'
//				};
//				s3.listObjects(params, async (err, data) => {
//					if (err) {
//						reject(err);
//					} else {
//						const urlList = [];
//						for (var i = 0 ; i < data.Contents.length ; i++) {
//							const obj = data.Contents[i];
//							if (obj.Key == directory) continue;
//							
//							const signedUrl = await cfsign.getSignedUrl(
//								'http://d3046nlf9waumu.cloudfront.net/' + obj.Key,
//								signingParams
//							);
//							
//							urlList.push(signedUrl);
//							if (obj.Key == data.Contents[data.Contents.length - 1].Key) {
//								resolve(urlList);
//								return false;
//							}
//						}
//					}
//				});
//			} catch (e) {
//				reject(e);
//			}
//		});
//	}

	// Get signed url for object from s3 bucket
	getSignedUrl: async (directory) => {
		return new Promise (async (resolve, reject) => {
			try {
				const params = {
					Bucket: 'seek-customer-storage',
					Key: directory
				};

				s3.getSignedUrl('getObject', params, (err, data) => {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	},

	// Get list of signed url for objects in given directory
	getSignedUrlList: async (directory) => {
		return new Promise (async (resolve, reject) => {
			try {
				const params = {
					Bucket: 'seek-customer-storage',
					Prefix: directory,
					Delimiter: '/'
				};
				s3.listObjects(params, async (err, data) => {
					if (err) {
						reject(err);
					} else {
						const urlList = [];
						for (var i = 0 ; i < data.Contents.length ; i++) {
							const obj = data.Contents[i];
							if (obj.Key == directory) continue;
							const objParams = {
								Bucket: 'seek-customer-storage',
								Key: obj.Key
							};
							s3.getSignedUrl('getObject', objParams, (objErr, objData) => {
								if (objErr) {
									reject(objErr);
								} else {
									urlList.push(objData);
									if (obj.Key == data.Contents[data.Contents.length - 1].Key) {
										resolve(urlList);
									}
								}
							});
						}
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	}

};

