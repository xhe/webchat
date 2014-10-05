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