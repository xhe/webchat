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
	_ = require('lodash')
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
	ChatRoom.find({ creator: user }).sort('-created').exec(function(err, chatrooms){
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
	ChatRoom.find({ members: user, creator: { '$ne': user } }).sort('-created').exec(function(err, chatrooms){
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

exports.retrieveChatMessages = function(user, roomId, cb){
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

var broadcastMessage = function(message){
	//1. find room
	ChatRoom
		.findById( message.room )
		.populate('members')
		.populate('creator')
		.exec(function(err, room){
			_.forEach(room.members, function(member){
				socket_serivce['sentChatMessage'](message,member);
			});
			socket_serivce['sentChatMessage'](message,room.creator);
		});
}