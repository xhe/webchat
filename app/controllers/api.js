var country_service =  require('../services/country');
var user_service =  require('../services/user');
var core_service =   require('../services/core');
var chat_service = require('../services/chat');
var invitation_service = require('../services/invitation');
var util = require('../services/utils');
var push_notification_service = require('../services/push_notify');
var swig = require('swig');
var mongoose = require('mongoose');
var Client = mongoose.model('Client');

exports.countries = function(req, res){
	country_service.getAll(req, res);
};

exports.addUser = function(req, res){
	user_service.createUser(req, res);
};

exports.login = function(req, res){ 
	user_service.login(req, res);
};

exports.autologin = function(req, res){
	user_service.autologin(req, res);
};

exports.upload_profile_file = function(req, res){
	
	core_service.processProfileImages( req.files.photo.path, req.user, function(data){
		if(data){
			res.jsonp(req.user.photos);
		}else{
			res.end("failed");
		}
	});
};

exports.upload_chat_file = function(req, res){
	//console.log("uploading here " + req.files.photo.path);
	chat_service.addPhotoForChatMessage( req.files.photo.path, req.user,  req.params.roomId, function(message){
		if(message){
			//console.log("uploaded  " ); console.log( message )
			res.jsonp(message);
		}else{
			res.end("failed");
		}
	});
	
};

exports.upload_chat_audio_file = function(req, res){ 
	//console.log(  req.files.audio.path )
	chat_service.addAudioForChatMessage( req.files.audio.path, req.user,  req.params.roomId, function(message){
		if(message){
			res.jsonp(message);
		}else{
			res.end("failed");
		}
	});
	
};
exports.upload_chat_video_file = function(req, res, next){
	//res.end("uploaded")
	
	var audioPath = req.files.audio? req.files.audio.path:"";
	var videoPath = req.files.video? req.files.video.path:"";

	chat_service.addVideoForChatMessage( audioPath,
										 videoPath,
										 req.user,  
										 req.params.roomId, function(err, message){
		if(err){
			return next(err);
		}else{
			res.jsonp(message);
		}
	});
	
};

exports.myphotos = function(req, res){
	res.jsonp(req.user.photos);
};

exports.update_default = function(req, res){
	req.user.updateDefaultHead(req.body.photoId, function(){
		res.jsonp({status:"success"});
	});
};

exports.update_photo = function(req, res){
	req.user.updatePhotoDescription(req.body.photoId, req.body.title, req.body.description, function(){
		res.jsonp({status:"success"});
	});
};


exports.delete_photos = function(req, res){
	req.user.removePhoto(req.body.photoIds, function(){
		res.jsonp({status:"success"});
	});
}

exports.delete_myphotos = function(req, res){
	req.user.removePhoto(req.body.photoIds, function(){
		res.jsonp({status:"success"});
	});
}

exports.chatrooms = function(req, res){
	chat_service.findUserCreatedRooms(req.user, function(rooms){
		var ownRooms = rooms;
		chat_service.findUserParticipatedRooms(req.user, function(rooms){
			res.jsonp({own_rooms: ownRooms, join_rooms: rooms});
		})
	})
}


exports.createChatrooms = function(req, res){
	req.user.createChatRoom(req.body.title, req.body.description, function(data){
		res.jsonp(data);
	});
}

exports.deleteChatrooms = function(req, res){
	req.user.deleteChatRoom(req.params.roomId, function(data){
		res.jsonp(data);
	});
}

exports.search = function(req, res){
	var type = req.params.type;
	if(type=="contacts"){
		var criterias = {
				phoneNumber: req.body.phoneNumber.toString().replace( /^\D+/g, ''),
				email: req.body.email,
				screenName: req.body.name
		};
		user_service.search_friends( criterias, req.user, function(data){
			res.jsonp(data);
		});
	}else if(type=="contact"){
		user_service.search_friend( req.body.userId, function(data){
			res.jsonp(data);
		});
	}
}

exports.invite = function(req, res){
	var inviteeId = req.params.id;
	var msg = req.body.message;
	var roomId = req.body.roomId;

	invitation_service.invite(req.user, inviteeId, msg, roomId, function(data){
		res.jsonp(data);
	});
}


exports.received_pending_invitations = function(req, res){
	invitation_service.getMyInvitation(req.user, invitation_service.STATUS_PENDING, function(data){
		res.jsonp(data);
	});
}

exports.invitationDetail = function(req, res){
	invitation_service.findInvitationById(req.params.id, function(inv){
		res.jsonp(inv);
	});
}

exports.invitationReply = function(req, res){
	invitation_service.replyInvitation(req.user, 
			req.body.invitation_id,
			req.body.action, 
			req.body.msg, 
			function(data){
				res.jsonp(data);
			}
	);
}


exports.chatmessages = function(req, res){
	//console.log('retrieving from ' + req.params.roomId)
	chat_service.retrieveChatMessages(req.user, req.params.roomId, null, function(data){
		res.jsonp(data);
	});
}

exports.chatmessagesbefore = function(req, res){
	chat_service.retrieveChatMessages(req.user, req.params.roomId, req.params.endts, function(data){
		res.jsonp(data);
	});
}

exports.addChatMessage = function(req, res){
	chat_service.addChatMessage(req.user, req.body.roomId, req.body.message, function(data){
		res.jsonp(data);
	});
}

exports.getContacts = function(req, res){
	user_service.get_contacts(req.user.screenName, function(data){
		res.jsonp(data);
	});
}

exports.getXirsysInfo = function(req, res){
	util.getXirSysInfo(req.params.room, function(err, data){
		res.jsonp(data);
	});
}

exports.call = function(req, res){
	chat_service.call( req.body.type, req.user, req.body.user_name, function(err, response){
		if(err){
			res.jsonp({status: 'failed', err: err});
		}else{
			res.jsonp({status: 'success', roomName: response});
		}
	});
}

exports.android_register = function(req, res){ 
	var regId = req.body.regId;
	push_notification_service.updateRegistrationId(req.user, regId, req.body.type, function(data){
		res.jsonp(data);
	});
}

exports.ios_register = function(req, res){ 
	push_notification_service.updateRegistrationId(req.user, req.body.regId, req.body.type, function(data){
		res.jsonp(data);
	});
}

exports.refer = function(req, res){
	user_service.refer(
			req.user, 
			req.body.email, 
			req.body.name, 
			req.body.message, 
			function(err, refer){
				if(err){
					res.jsonp({status: 'failed', err: err});
				}else{
					res.jsonp({status: 'success', refer: refer});
				}
			}
	);
}

exports.resetPasswrod = function(req, res){
	user_service.sendResetPwdEmail(req.body.email, function(err){
		if(err){
			res.jsonp({status: 'failed', err: err});
		}else{
			res.jsonp({status: 'success'});
		}
	});
}

exports.getRefer = function(req, res){
	user_service.getRefer( req.params.id, function(err, refer){
		if(err){
			res.jsonp({status: 'failed', err: err});
		}else{
			var referNames = refer.name.split(" ");
			var client = new Client({
				email: refer.to,
				firstName: referNames.length>0?referNames[0]:"",
				lastName : referNames.length>1?referNames[1]:""
			});
			res.jsonp({status: 'success', user: client});
		}
	});
},

exports.update_settings = function(req, res){
	var settings = req.body.settings;
	req.user.settings_records_forever = req.body.records_forever;
	req.user.settings_records_days = req.body.records_days;
	req.user.settings_media_days = req.body.media_days;
	req.user.settings_disable_sounds = req.body.disable_sounds;
	req.user.save(function(err,doc){
		res.jsonp({status: 'success', user: doc})
	});
},


exports.uploadTest = function(req, res, next){
	console.log( req.files );
	console.log(' uploaded ');
	res.end('finished')
};

exports.removeChatMessage = function(req, res, next){
	chat_service.removeChatMsg(req.body.msgId, req.user, function(err, data){
		if(err){
			res.jsonp({status: 'failed', err: err});
		}else{
			res.jsonp({status: 'success'});
		}
	});
}