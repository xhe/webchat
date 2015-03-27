require('../models/chat');
require('../models/client');
require("../models/highlight");

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
	Client = mongoose.model('Client'),
	Membership =  mongoose.model('Membership'),
	Highlight = mongoose.model('Highlight'),
	Favorite = mongoose.model('Favorite')
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
		.deepPopulate('creator.membership')
		.exec(function(err, chats){
			var chats = _.filter(chats, function(chat){
				return chat.creator.isPaidMember()?false:true;
			});
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
		.populate('membership')
		.exec(function(err, clients){ 
			var clients = _.filter(clients, function(client){
				return client.isPaidMember()?false:true;
			});
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
};


var getHighlightsBefore = function(days, cb){
	
	var ts = new Date().getTime()-days*3600*24*1000;
	var preDate = new Date( ts ); 
	Highlight
		.find(	
				{
					$and: [
					       	{
					       		created: { "$lt": preDate },
					       	},
					       	
					       	{ 
								$or:[ 
						             	{ photos: { $ne: null }},
						             	{ audios: { $ne: null }}
						             ]
							}
					       	
					       ]
				}
		)
		.deepPopulate('creator.membership')
		.populate("photos audios shared_link")
		.exec(function(err, highlights){
			var highlights = _.filter(highlights, function(highlight){
				return highlight.creator.isPaidMember()?false:true;
			});
			
			cb(err, highlights);
		})
};



var deleteHighlight = function(highlight, cb){
	
	var removeHighlightPhotos = function(highlight, cb){
		highlight.removePhotos(_.pluck(highlight.photos, function(photo){ return photo._id }), cb);
	};
	
	var checkRefereCountForLink = function(link, cb){
		Highlight.where({"shared_link": link}).count(function(err, cn1){
			ChatMessage.where({"shared_link": link}).count(function(err, cn2){
				cb(err, cn1+cn2);
			});
		});
	};
	
	var removeHighlightLink = function(highlight, cb){
		if(highlight.shared_link){
			//checking total reference
			checkRefereCountForLink(highlight.shared_link, function(err, count){
				if(err){
					cb(err);
				}else {
					if( count==1 ){
						//only delete the link obj if it is ONLY referered by this highlight
						highlight.shared_link.remove(function(err, doc){
							cb(err, highlight);
						});
					} else {
						cb(null, highlight);
					}
				}	
			});
			
		}else{
			cb(null, highlight);
		}
	};
	
	var removeFavorite = function(highlight, cb){
		Favorite.remove({ highlight: highlight }, function(err, docc){
			cb(err, highlight);
		});
	};
	
	
	var removeHighlightAudios = function(highlight, cb){
		highlight.removeAudios(_.pluck(highlight.audios, function(audio){ return audio._id }), cb);
	};
	
	var removeHighlight = function(highlight, cb){
		highlight.remove(cb)
	};
	
	async.waterfall([
	                 	async.apply( removeHighlightPhotos, highlight ),
	                 	async.apply( removeHighlightAudios ),
	                 	async.apply( removeHighlightLink ),
	                 	async.apply( removeFavorite),
	                 	async.apply( removeHighlight ),
	                 ], cb );
	
};

var cleanHighlights = function(highlights, cb){
	async.eachLimit( highlights, 10, deleteHighlight, function(err, results){
		cb(err, results);
	})
};

exports.removeHighlights = function(days, cb){
	async.waterfall(
			[
				async.apply(getHighlightsBefore, days),
				async.apply(cleanHighlights)
			 ],
			 function(err, result){
				cb(err, result);
			}
	);	
};

exports.addMemberShip = function(userName, startDt, days, level, cb){
	
	var ts = startDt.getTime()+days*3600*24*1000;
	var endDt = new Date(ts);
	
	Client.findOne({screenName: userName}).exec(function(err, client){
		Membership.findOne({user: client}).exec(function(err, membership){
			if(membership == null){
				membership = new Membership();
			} 
			
			membership.user = client;
			membership.level = level;
			membership.fromDate = startDt;
			membership.toDate = endDt;
				
			membership.save(function(err, data){
				if(err){
					cb(err);
				}else{
					client.membership = data;
					client.save( function(err, doc){
						cb(err, client);
					});
				}
			});
		});
		
	});
}
