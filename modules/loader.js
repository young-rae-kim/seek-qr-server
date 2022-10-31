var s3 = require('../config/storage')
var cfUtil = require('aws-cloudfront-sign')

const aws = require('aws-sdk')
const fs = require('fs')

/**
 * From AWS console root user > security credentials
 * Refer to this screenshot https://cdn-images-1.medium.com/max/716/1*lj0SGfHRLt8pvoe1OLla6Q.png
 */
const accessKeyID = 'APKAUMNUTJ6OJMFHQGIF'

/**
 * From local
 * The contents of the private key file
 * Refer to this screenshot https://cdn-images-1.medium.com/max/716/1*5VBnhzFnZNRZ0jp3eY9uFA.png
 */
const privateKeyFilePath = '/home/ubuntu/seek-qr-server/config/pk-APKAUMNUTJ6OJMFHQGIF.pem'
const privateKeyContents = fs.readFileSync(privateKeyFilePath, 'utf8')
        
/**             
 * From AWS Console > Cloudfront > Distributions
 * Refer to this screenshot https://cdn-images-1.medium.com/max/716/1*UZI0mq0LJd5Hn2t5psOrwA.png
 */
const cfDomainName = 'https://d2aorer9vopjj7.cloudfront.net'
const rtmpDomainName = 'd2aorer9vopjj7.cloudfront.net'
let signer = new aws.CloudFront.Signer(accessKeyID, privateKeyContents)

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
	getSignedUrl: async (directory) => {
		const cfFullPath = `${cfDomainName}/${directory}`;
		const option = {
    			url: cfFullPath,
    			expires: Math.floor(
				(new Date()).getTime()
			) + (60 * 60 * 1), // 1 hour from now
		};

		return new Promise((resolve, reject) => {
    			signer.getSignedUrl(option, (err, url) => {
        			if (err) {
					console.error(err);
            				reject(err);
        			} else {
					resolve(url);
        			}
    			})
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
							if (obj.Key === directory) continue;
							
							const cfFullPath = `${cfDomainName}/${obj.Key}`;
	               					const option = {
                        					url: cfFullPath,
                        					expires: Math.floor(
									(new Date()).getTime()
								) + (60 * 60 * 1), // 1 hour from now
                					};

							signer.getSignedUrl(option, (err, url) => {
								if (err) {
									console.error(err);
									reject(err);
								}
								else {
									urlList.push(url)
									if (i === data.Contents.length - 1) {
										resolve(urlList);
										return false;
									}
								}
							})
						}
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	},
	
	// Get rtmp url for object from s3 bucket
	getRtmpUrl: async (directory) => {
		const option = {
			keypairId: accessKeyID,
			privateKeyString: privateKeyContents,
    			expireTime: Math.floor(
				(new Date()).getTime()
			) + (60 * 60 * 1), // 1 hour from now
		};

		return new Promise((resolve, reject) => {
    			const signedRTMPUrlObj = cfUtil.getSignedRTMPUrl(
				rtmpDomainName, 
				directory, 
				option
			)
			resolve(signedRTMPUrlObj) 
		});
	},

	// Get list of rtmp url for objects in given directory
	getRtmpUrlList: async (directory) => {
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
						const option = {
							keypairId: accessKeyID,
							privateKeyString: privateKeyContents,
                        				expireTime: Math.floor(
								(new Date()).getTime()
							) + (60 * 60 * 1), // 1 hour from now
                				};

						for (var i = 0 ; i < data.Contents.length ; i++) {
							const obj = data.Contents[i];
							if (obj.Key === directory) continue;

							const url = cfUtil.getSignedRTMPUrl(
								rtmpDomainName, 
								obj.Key,
								option
							)

							urlList.push(url)
							if (i === data.Contents.length - 1) {
								resolve(urlList);
								return false;
							}
						}
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	}


	// Get signed url for object from s3 bucket
//	getSignedUrl: async (directory) => {
//		return new Promise (async (resolve, reject) => {
//			try {
//				const params = {
//					Bucket: 'seek-customer-storage',
//					Key: directory
//				};
//
//				s3.getSignedUrl('getObject', params, (err, data) => {
//					if (err) {
//						reject(err);
//					} else {
//						resolve(data);
//					}
//				});
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
//							const objParams = {
//								Bucket: 'seek-customer-storage',
//								Key: obj.Key
//							};
//							s3.getSignedUrl('getObject', objParams, (objErr, objData) => {
//								if (objErr) {
//									reject(objErr);
//								} else {									
//										urlList.push(objData);
//										if (obj.Key == data.Contents[data.Contents.length - 1].Key) {
//										resolve(urlList);
//									}
//								}
//							});
//						}
//					}
//				});
//			} catch (e) {
//				reject(e);
//			}
//		});
//	}

};

