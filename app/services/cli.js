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
	path = require('path'),
	Client = mongoose.model('Client')
	;
	
var getChatMsgBefore = function(days, cb){
	
	var ts = new Date().getTime()-days*3600*24*1000;
	//ts = new Date().getTime()
	var preDate = new Date( ts ); 
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

var deleteChatMedia = function (chat, cb){
	
			if(chat.photo){ 
				var path_original = __dirname+'/../../www/uploads/original/';
				var path_thumb =  __dirname+'/../../www/uploads/thumb/';
				fs.unlink(path_original+chat.photo.filename );
				_.forEach(chat.photo.renders, function(render){
					fs.unlink(path_thumb + render.filename);
				});
			
				PhotoSchema
				.findById(chat.photo._id)
				.remove().exec();
			}
			
				
			if(chat.audio){
				var path =  __dirname+'/../../www'; 
				fs.unlink(   path + chat.audio.filename )
				Audio.findById(chat.audio._id).remove().exec();
			}
			
			if(chat.video){
				var path =  __dirname+'/../../www'; 
				fs.unlink(   path+ chat.video.filename )
				Video.findById(chat.video._id).remove().exec();
			}
			
		
		cb(null, chat);
}

var cleanChats = function(chats, cb){
	
	
	var deleteChat = function(chat, cb){
		chat.remove(function(err, doc){
			if(err)
				cb(err)
			else
				deleteChatMedia(doc, cb);
		});
	}
	
	async.eachLimit( chats, 10, deleteChat, function(err, results){
		cb(err, results);
	})
	
};

exports.cleanMedias = function(days, cb){
	
	async.waterfall(
			[
				async.apply(getChatMsgBefore, days),
				async.apply(cleanChats)
			 ],
			 function(err, result){
				cb(err, result);
			}
			
	);
	
}

var getUsersToProcess = function(max, days, cb){
	var ts = new Date().getTime()-days*3600*24*1000;
	//ts = new Date().getTime()
	var preDate = new Date( ts ); 
	Client
		.find(
				{
					$or:[
							{
								processed: { "$lt": preDate }
							},
							{
								processed: null
							}
					     ]
					}
				)
		.limit(max)
		.exec(function(err, clients){ 
			cb(err, clients);
		})
		;
}

var getChatsForClientBefore = function(client, beforeDate, cb){  
	ChatMessage
		.find({
			$and: [
			        {
			        	creator: client
			        },
			       	{
			       		created: { "$lt": beforeDate }
			       	}
			       ]
		})
		.populate('photo audio video')
		.exec(function(err, chats){
			cb(err, chats)
		})
		;
}

var getChatsWidthMediaForClientBefore = function(client, beforeDate, cb){
	ChatMessage
		.find({
			$and: [
			        {
			        	creator: client
			        },
			       	{
			       		created: { "$lt": beforeDate }
			       	},
			    	{ 
						$or:[ 
				             	{ photo: { $ne: null }},
				             	{ audio: { $ne: null }},
				             	{ video: { $ne: null }}
				             ]
					}
			       ]
		})
		.populate('photo audio video')
		.exec(function(err, chats){ 
			cb(err, chats)
		})
		;
}

var cleanMediasAndChat4Clients = function(clients, cb){
	
	var cleanMediasAndChat4Client = function(client, cb){
		if(!client.settings_records_forever){  //removing record completely
			var ts = new Date().getTime()-client.settings_records_days*3600*24*1000;
			async.waterfall(
					[
						async.apply(getChatsForClientBefore, client, ts),
						async.apply(cleanChats)
					 ],
					 function(err, result){
						if(!err)
						{
							client.processed = new Date().getTime()
							client.save( function(err, doc){
								cb(err, result);
							});
						}else{
							cb(err, result);
						}
					}
			);
		} else {
			//let's remove media here
			var ts = new Date().getTime()-client.settings_media_days*3600*24*1000;
			async.waterfall(
					[
						async.apply(getChatsWidthMediaForClientBefore, client, ts),
						async.apply(cleanChats)
					 ],
					 function(err, result){
						if(!err)
						{
							client.processed = new Date().getTime()
							client.save( function(err, doc){
								cb(err, result);
							});
						}else{
							cb(err, result);
						}
					}
			);
		}
	}
	
	async.eachLimit( clients, 10, cleanMediasAndChat4Client, function(err, results){
		cb(err, results);
	})
	
}

exports.cleanChatAndMedia = function(max, days, cb){
	
	async.waterfall(
			[
				async.apply(getUsersToProcess, max, days),
				async.apply(cleanMediasAndChat4Clients)
			 ],
			 function(err, result){
				cb(err, result);
			}
			
	);
}

