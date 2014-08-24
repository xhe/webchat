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
	_ = require('lodash')
	;

exports.retrieveChatMessages = function(user, roomId, cb){
console.log(roomId)
	//1. get last visit dt for this room
	ChatRoomVisitLog
		.findOneAndUpdate(
					{
						visitor: user,
						room: new ObjectId(roomId)
					},
					{
						visited: Date.now()
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