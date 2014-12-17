var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	socket_serivce = require('./sockets')(),
	utils = require('./utils'),
	ChatRoom = mongoose.model('ChatRoom'),
	ChatMessage = mongoose.model('ChatMessage'),
	ChatRoomVisitLog = mongoose.model('ChatRoomVisitLog'),
	socket_serivce = require('./sockets')(),
	chat_service = require('./chat'),
	core_service = require('./core'),
	Audio = mongoose.model('Audio'),
	Video = mongoose.model('Video'),
	_ = require('lodash'),
	async = require('async'),
	fs = require('fs')
	;

exports.chatRoomNewChatMsg = function(user, room, cb ){
	ChatRoomVisitLog
	.findOne({
		visitor: user,
		room: room
	})
	.exec(function(err, doc){
		var lastVisit = null;
		if(doc){
			lastVisit = doc.visited;
		}
		var query = { room: room }
		if(lastVisit){
			query['created'] =  { $gte: lastVisit };
		}
		ChatMessage.count(query, function(err, count){
			cb(count);
		});
	});
};


exports.findUserCreatedRooms = function(user, cb){
	ChatRoom
		.find({ creator: user })
		.populate('creator')
		.populate('members')
		.sort('-created')
		.exec(function(err, chatrooms){
			_.forEach(chatrooms, function(r){
				r.creator =  utils.simplifyUser(r.creator, true);
				_.forEach(r.members, function(m){
					m = utils.simplifyUser(m, true);
				});
			});
			if( chatrooms.length>0 ){
				populateNewMsgsForRooms(chatrooms, user, function(rooms){
					cb(rooms);
				});
			}else{
				cb([]);
			}
		});
}

exports.findUserParticipatedRooms = function(user, cb){
	ChatRoom
		.find({ members: user, creator: { '$ne': user } })
		.populate('creator')
		.populate('members')
		.sort('-created')
		.exec(function(err, chatrooms){
			_.forEach(chatrooms, function(r){
				r.creator =  utils.simplifyUser(r.creator, true);
				_.forEach(r.members, function(m){
					m = utils.simplifyUser(m, true);
				});
			});
			if( chatrooms.length>0 ){
				populateNewMsgsForRooms(chatrooms, user, function(rooms){
					cb(rooms);
				});
			}else{
				cb([]);
			}
	});
}

//needs to show if new msg
var populateNewMsgsForRooms = function(chatrooms, user, cb){
	var totalRooms = chatrooms.length;
	var finalRooms = [];
	while(chatrooms.length>0){
		var room = chatrooms.shift();
		(function(room){
			chat_service.chatRoomNewChatMsg( user, room, function(count){
				room.new_messages = count;
				finalRooms.push(room);
				if(finalRooms.length == totalRooms)
					cb(finalRooms);
			})
		})(room)
	}
}

exports.retrieveChatMessages = function(user, roomId, before_ts, cb){
	//1. get last visit dt for this room
	ChatRoomVisitLog
		.findOneAndUpdate(
					{	
						visitor: user,
						room: new ObjectId(roomId)
					},
					{
						visited: Date.now()
					},
					{
						upsert: true
					}
				)
		.exec(function(err, doc){
			
				if(err){
					console.log(err);
				}else{
					//let's retrieve
					var q= ChatMessage.find({
						room:	 new ObjectId(roomId)
					});
					q.sort('-created');
					q.limit(20);
					q.populate('creator');
					q.populate('photo');
					q.populate('audio');
					q.populate('video');
					if(before_ts){
						q.where('created').lt(before_ts);
					}
					
					q.exec(function(err, docs){
						for(var i=0; i<docs.length; i++){
							docs[i].creator = utils.simplifyUser(docs[i].creator, true);
						}
						cb(docs);
					});
				}
		}
		);
};



exports.addChatMessage = function(user, roomId, msg, cb){
	var message = new ChatMessage({
		creator: user,
		room:	 new ObjectId(roomId),
		message: msg,
		created: Date.now()
	});
	message.save( function(err) {
		if(err){
			console.log(err);
		}else{
			ChatMessage
			.findById(message._id)
			.populate('creator')
			.exec(function(err, message){
				
				message.creator = utils.simplifyUser(message.creator, true);
				cb(message);
				
				broadcastMessage( message);
				ChatRoomVisitLog.findOneAndUpdate(
					{
						visitor: user,
						room: new ObjectId(roomId)  
					},
					{
						visited: Date.now()
					},
					function(err, log){
						if(err){
							console.log(err);
						}else{
							//cb(log);
						}
					}
				);
			});
		}
	});
};

exports.addPhotoForChatMessage = function(filePath, user, roomId, cb){
	var message = new ChatMessage({
		creator: user,
		room:	 new ObjectId(roomId),
		created: Date.now()
	});
	message.save( function(err) {
		if(err){
			console.log(err);
		}else{
			ChatMessage
			.findById(message._id)
			.exec(function(err, message){
				core_service.processChatImages(filePath, user, roomId,  function(photo){
					message.photo = photo;
					message.save( function(err) {
						ChatMessage
						.findById(message._id)
						.populate('photo')
						.populate('creator')
						.exec(function(err, message){
							message.creator = utils.simplifyUser(message.creator, true);
							cb(message);
							
							broadcastMessage( message); 
							ChatRoomVisitLog.findOneAndUpdate(
								{
									visitor: user,
									room: new ObjectId(roomId)  
								},
								{
									visited: Date.now()
								},
								function(err, log){
									if(err){
										console.log(err);
									}else{
										//cb(log);
									}
								}
							);
						});
					});
				});
			});
		}
	});
};

exports.addVideoForChatMessage = function(audioPath, videoPath, user, roomId, cb){
	
	var merge = function(audioPath, videoPath, user, cb){
		
		pos = videoPath.indexOf('uploads');
		fileName = videoPath.substr(pos+8);
		filePath = videoPath.substr(0,pos+8 );	
		var mergedFile =  filePath+'video/'+user._id+"_"+fileName;
		
		if(audioPath.length>0 ){
			mergedFile = mergedFile +".mov";
			var command = "ffmpeg -i " + audioPath + " -i " + videoPath + " -map 0:0 -map 1:0 -strict -2 " + mergedFile;
			
			//var command = "ffmpeg -i " + audioPath + " -i " + videoPath + " -map 0:0 -map 1:0 -strict 2 " + mergedFile +'.mov';
			
			var  exec = require('child_process').exec;
			exec(command, function(err, stdout, stderr){
		        if(err){
		        	cb(err);
		        } else {
		        	fs.unlink( videoPath );
		        	fs.unlink( audioPath );
		        	cb(null, mergedFile.replace("www",""));
		        }
			});
		} else {
			if(  mergedFile.substr(mergedFile.length-4).toLowerCase() =='.mov' ){
				mergedFile = mergedFile.substr(0, mergedFile.length-4)+"_"+ new Date().getTime() +".mp4";
				//ffmpeg -i movie.mov -vcodec copy -acodec copy out.mp4
				var command = "ffmpeg -i " + videoPath + " -vcodec copy -acodec copy " + mergedFile.substr(0, mergedFile.length-4)+".mp4";
				var  exec = require('child_process').exec;
				console.log( command )
				exec(command, function(err, stdout, stderr){
			        if(err){
			        	cb(err);
			        } else {
			        	//fs.unlink( videoPath );
			        	cb(null, mergedFile.replace("www",""));
			        }
				});
			}else{
				wr = fs.createWriteStream(mergedFile);
				wr.on('close', function(ex){
							fs.unlink(videoPath);
				});
				fs.createReadStream(videoPath).pipe(wr); 
				cb(null, mergedFile.replace("www",""));
			}
		}
	};
	
	
	var createNewChatMsg = function(roomId,user, filePath, cb){ 
		
		var index = filePath.indexOf('//');
		var video = new Video({
			filename: filePath.substr(index+1)
		});
		video.save(function(err, vid){
			var message = new ChatMessage({
				creator: user,
				room:	new ObjectId(roomId),
				video:	vid,
				created: Date.now()
			});
			message.save(function(err, msg){
				
				ChatMessage
				.findById(msg._id)
				.populate('photo')
				.populate('audio')
				.populate('video')
				.populate('creator')
				.exec(function(err, message){
					
					message.creator = utils.simplifyUser(message.creator, true);
					cb(null, message);
					
					broadcastMessage( message); 
					ChatRoomVisitLog.findOneAndUpdate(
						{
							visitor: user,
							room: new ObjectId(roomId)  
						},
						{
							visited: Date.now()
						},
						function(err, log){
							if(err){
								console.log(err);
							}else{
								//cb(log);
							}
						}
					);
				});
			});
		});
	};
	
	async.waterfall([
	                  async.apply( merge, audioPath, videoPath, user),
	                  async.apply( createNewChatMsg, roomId, user)
	                 ], cb);
};


exports.addAudioForChatMessage = function(audioPath, user, roomId, cb){
	var message = new ChatMessage({
		creator: user,
		room:	 new ObjectId(roomId),
		created: Date.now()
	});
	message.save( function(err) {
		if(err){
			console.log(err);
		}else{
			ChatMessage
			.findById(message._id)
			.exec(function(err, message){
				
					
					pos = audioPath.indexOf('uploads');
					fileName = audioPath.substr(pos+8);
					filePath = audioPath.substr(0,pos+8 );	
		
					wr = fs.createWriteStream( filePath+'audio/'+user._id+"_"+fileName);
					wr.on('close', function(ex){
								fs.unlink(audioPath);
					});
					fs.createReadStream(audioPath).pipe(wr);
				
				
					var audio = new Audio({
						filename: '/uploads/audio/'+user._id+"_"+fileName
					});
					
					audio.save(function(err, doc){
						message.audio = doc;
						message.save( function(err, msg) {
							ChatMessage
							.findById(msg._id)
							.populate('photo')
							.populate('audio')
							.populate('video')
							.populate('creator')
							.exec(function(err, message){
								
								message.creator = utils.simplifyUser(message.creator, true);
								cb(message);
								
								broadcastMessage( message); 
								ChatRoomVisitLog.findOneAndUpdate(
									{
										visitor: user,
										room: new ObjectId(roomId)  
									},
									{
										visited: Date.now()
									},
									function(err, log){
										if(err){
											console.log(err);
										}else{
											//cb(log);
										}
									}
								);
								
							});
						});
					});
			});
		}
	});
};

exports.call = function(type, caller, callee_userName, cb){
	socket_serivce['sendCallRequest'](type, caller, callee_userName, function(err, roomName){
		if(err){
			cb(err);
		}else{
			cb(null, roomName);
		}
	});
	
};

var broadcastMessage = function(message){ 
	//1. find room
	ChatRoom
		.findById( message.room )
		.populate('members')
		.populate('creator')
		.exec(function(err, room){
			socket_serivce['broadcastChatMessage'](message, room);
		});
}
