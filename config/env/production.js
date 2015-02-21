'use strict';

module.exports = {
	db: 'mongodb://localhost/mean-prod',
	app: {
		title: 'MEAN.JS - Production Environment'
	},
	smtp:{
		service: 'localhost'
	},
	host_url: 'http://www.chat4each.com/',
	
	push_notification_ios_files:{
		keyFile: __dirname+'/../ios/release/pushchatkey.pem',
		certFile: __dirname+'/../ios/release/pushchatcert.pem',
		passphrase: 'chat4each',
		gateway: 'gateway.push.apple.com',
		debug: true
	},
};