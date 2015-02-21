var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Invitation = mongoose.model('Invitation')
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	socket_serivce = require('./sockets')(),
	utils = require('./utils'),
	invitation_service = require('./invitation'),
	ChatRoom = mongoose.model('ChatRoom'),
	relationship_service = require('./relationship')
	;

exports.STATUS_PENDING = 0;
exports.STATUS_ACCEPTED = 1;
exports.STATUS_REFUSED = 2;

exports.getMyInvitation = function(invitee, status, cb){
	
	Invitation.find({ to: new ObjectId(invitee._id), status: status})
				.sort('-created')
				.populate('from')
				.exec(function(err, docs){
					for(var i=0; i<docs.length; i++){
						docs[i].from = utils.simplifyUser(docs[i].from, true);
					}
					cb(err, docs);
				});
};

exports.findInvitationById = function(id, cb){
	Invitation.findById( new ObjectId(id))
			  .populate('from')
			  .populate('room')
			  .exec(function(err, invitation){
				 invitation.from = utils.simplifyUser(invitation.from , true); 
				 cb(invitation);
			  });
	;
};

exports.invite = function(invitor, inviteeId, msg, roomId,  cb,  disableNotify){
	Client.findById(new ObjectId(inviteeId), function(err, invitee){
		
		if(err){
			cb({status: 'failed', error: err})
		}else{
			if(roomId!=='null'){
				Invitation.find(
						{
							from: invitor._id,
							to:	  invitee._id,
							status: invitation_service.STATUS_PENDING,
							room: roomId
						}, function(err, docs){
							if(docs.length>0){
								cb({status: 'failed', error: 'You have invited the person already, no need to invite again'});
							}else{
								invitation = new Invitation({
									from: invitor._id,
									to:	  invitee._id,
									message: msg,
									status: invitation_service.STATUS_PENDING,
									room: roomId
								});
								invitation.save(function(err, doc){
									if(err){
										cb({status:"failed", error: err});
									}else{
										Invitation.findById( new ObjectId(invitation._id)).
										populate('from').
										populate('to').
										exec(function(err, invitation){
											//notify socket
											invitation.from = utils.simplifyUser(invitation.from, true);
											invitation.to =   utils.simplifyUser(invitation.to, true);
											if(!disableNotify)
												socket_serivce["sendInvitation"](invitation);
											cb({status:"success", content: invitation });
										});
										
									}
								});
							}
						});
			}else{
				Invitation.find(
						{
							from: invitor._id,
							to:	  invitee._id,
							status: invitation_service.STATUS_PENDING
						}, function(err, docs){
							if(docs.length>0){
								cb({status: 'failed', error: 'You have invited the person already, no need to invite again'});
							}else{
								invitation = new Invitation({
									from: invitor._id,
									to:	  invitee._id,
									message: msg,
									status: invitation_service.STATUS_PENDING
								});
								invitation.save(function(err){
									if(err){
										cb({status:"failed", error: err});
									}else{
										Invitation.findById( new ObjectId(invitation._id)).
										populate('from').
										populate('to').
										exec(function(err, invitation){
											//notify socket
											invitation.from = utils.simplifyUser(invitation.from, true);
											invitation.to =   utils.simplifyUser(invitation.to, true);
											if(!disableNotify)
												socket_serivce["sendInvitation"](invitation);
											cb({status:"success", content: invitation });
										});
										
									}
								});
							}
						});
			}
		}
	});
};


exports.replyInvitation = function(invitee, invitation_id, action, msg, cb, disableNotification){
	
	Invitation.findById( new ObjectId(invitation_id))
	  .populate('to')
	  .populate('from')
	  .populate('room')
	  .exec(function(err, invitation){
	  
		  invitation.reply = msg;
		  if(action=='accept'){
			  invitation.status = invitation_service.STATUS_ACCEPTED;
		  }else{
			  invitation.status = invitation_service.STATUS_REFUSED;
		  }
		  invitation.seen = false;
		  invitation.save(function(){
			  
			  invitation.from = utils.simplifyUser(invitation.from, true);
			  invitation.to = utils.simplifyUser(invitation.to, true);
			  if(!disableNotification)
				  socket_serivce["replyInvitation"](invitation);
	  	
			  if(action=='accept'){
				//create chat room here
				  	if(invitation.room){
				  		
				  		var room =invitation.room;
				  		room.members.push( invitation.to )
				  		room.save(function(err){
							if(err){
								cb({status:"failed", error: err});
							}else{
								cb({status:"success",invitation: invitation  });
							}
						});
				  	}else{
				  		ChatRoom.find({creator: invitation.from, members:[invitation.to]}).
							exec(function(err, chatrooms){
							
								if(chatrooms.length==0){
									
									var room = new ChatRoom({
										name: invitation.from.screenName+" - " + invitation.to.screenName,
										creator: invitation.from,
										description: "",
										members: [ invitation.to ]
									});
									room.save(function(err){
										if(err){
											cb({status:"failed", error: err});
										}else{ 
											cb({status:"success",invitation: invitation  });
										}
									});
								} else {
									cb({status:"success",invitation: invitation  });
								}
						});
				  	}
			  }else{ 
				  cb({status:"success",invitation: invitation  });
			  }
			  
		  });
		  
	  });
}