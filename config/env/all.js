'use strict';

module.exports = {
	app: {
		title: 'MEAN.JS',
		description: 'Full-Stack JavaScript with MongoDB, Express, AngularJS, and Node.js',
		keywords: 'mongodb, express, angularjs, node.js, mongoose, passport'
	},
	redis: {
		host: 'localhost',
		port: 6379
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	default_token_length: 24*60*60,
	profile_image_sizes: [50, 100, 150,250,800],
	xirsys: {
		ident:'hexufeng',
		secret:'5d3ef7cd-11dd-448b-bf68-5d0d60513dd1',
		domain:'www.dealsmatcher.com'
	}, 
	
	push_notification: {
		supported_platform_android: true,
		supported_platform_ios: true,
		gcm_api_key: 'AIzaSyDq1w1P1GySFWGjXz5SFoz-I3t1iNbGi4s'
	},
	
	push_notification_ios_files:{
		keyFile: __dirname+'/config/ios/dev/Chat4EachKey.pem',
		certFile: __dirname+'/config/ios/dev/Chat4EachCert.pem',
		debug: true
	},
	
	assets: {
		lib: {
			css: [
				],
				js: [
				]
		},
		css: [
		],
		js: [			
		],
		tests: [
		]
	}
};