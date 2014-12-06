require('../models/chat');
require('../models/client');


var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async'),
	fs = require('fs'),
	ChatMessage = mongoose.model('ChatMessage'),
	async = require('async'),
	db = require('../../config/env/'+process.env.NODE_ENV).db;
	db = mongoose.connect(db),
	PhotoSchema = mongoose.model('PhotoSchema'),
	Audio= mongoose.model('Audio'),
	Video= mongoose.model('Video'),
	path = require('path')
	;
	
var getChatMsgBefore = function(days, cb){
	
	var ts = new Date().getTime()-days*3600*24*1000;
	//ts = new Date().getTime()
	var preDate = new Date( ts ); console.log( preDate )
	ChatMessage
		.find(	
				{
					$and: [
					       	{
					       		created: { "$lt": preDate },
					       	},
					       	
					       	{ 
								$or:[ 
						             	{ photo: { $ne: null }},
						             	{ audio: { $ne: null }},
						             	{ video: { $ne: null }}
						             ]
							}
					       	
					       ]
				}
		)
		.populate('photo audio video')
		.exec(function(err, chats){
			cb(err, chats);
		})
	
};

var cleanMediasForChats = function(chats, cb){
	
	var deleteMedia = function (chat, cb){
		chat.remove(function(err, doc){
		
				if(doc.photo){ 
					var path_original = __dirname+'/../../www/uploads/original/';
					var path_thumb =  __dirname+'/../../www/uploads/thumb/';
					
					fs.unlink(path_original+doc.photo.filename );
					_.forEach(doc.photo.renders, function(render){
						fs.unlink(path_thumb + render.filename);
					});
				
					PhotoSchema
					.findById(doc.photo._id)
					.remove().exec();
				}
				
					
				if(doc.audio){
					var path =  __dirname+'/../../www'; 
					fs.unlink(   path + doc.audio.filename )
					Audio.findById(doc.audio._id).remove().exec();
				}
				
				if(doc.video){
					var path =  __dirname+'/../../www'; 
					fs.unlink(   path+ doc.video.filename )
					Video.findById(doc.video._id).remove().exec();
				}
				
			
			cb(null, chat);
		});
	}
	async.eachLimit( chats, 10, deleteMedia, function(err, results){
		cb(err, results);
	})
	
};

exports.cleanMedias = function(days, cb){
	
	async.waterfall(
			[
				async.apply(getChatMsgBefore, days),
				async.apply(cleanMediasForChats)
			 ],
			 function(err, result){
				cb(err, result);
			}
			
	);
	
}

