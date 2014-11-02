var country_service =  require('../services/country');
var user_service =  require('../services/user');
var core_service =   require('../services/core');
var chat_service = require('../services/chat');
var invitation_service = require('../services/invitation');
var util = require('../services/utils');
var push_notification_service = require('../services/push_notify');


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
	
	core_service.processProfileImages(  __dirname+"/../../"+req.files.photo.path, req.user, function(data){
		if(data){
			res.jsonp(req.user.photos);
		}else{
			res.end("failed");
		}
	});
};

exports.upload_chat_file = function(req, res){
	
	chat_service.addPhotoForChatMessage( __dirname+"/../../"+req.files.photo.path, req.user,  req.params.roomId, function(message){
		if(message){
			res.jsonp(message);
		}else{
			res.end("failed");
		}
	});
	
};

exports.upload_chat_audio_file = function(req, res){
	chat_service.addAudioForChatMessage( __dirname+"/../../"+req.files.audio.path, req.user,  req.params.roomId, function(message){
		if(message){
			res.jsonp(message);
		}else{
			res.end("failed");
		}
	});
	
};
exports.upload_chat_video_file = function(req, res, next){
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
	console.log("regid is " + regId );
	push_notification_service.updateRegistrationId(req.user, regId, req.body.type, function(data){
		res.jsonp(data);
	});
	
	
	console.log('get request '); console.log(req.body);
/*	
	
	var gcm = require('node-gcm');
	var message = new gcm.Message();
	// or with object values
	var message = new gcm.Message({
	    collapseKey: 'demo',
	    delayWhileIdle: true,
	    timeToLive: 3,
	    data: {
	    	message: "PhoneGap Build rocks!",
	    	msgcnt: 1,
	    	soundname: 'beep.wav' 
	    }
	});
	// OPTIONAL
	// add new key-value in data object
	//message.addDataWithKeyValue('key3','message3');
	//message.addDataWithKeyValue('key4','message4');

	// or add a data object
	//message.addDataWithObject({
	//    key5: 'message5',
	//    key6: 'message6'
	//});
	
	var sender = new gcm.Sender('AIzaSyDq1w1P1GySFWGjXz5SFoz-I3t1iNbGi4s');
	var registrationIds = [];
	
	registrationIds.push(regId);
	/**
	 * Params: message-literal, registrationIds-array, No. of retries, callback-function
	 **/
	setTimeout(function(){
		sender.send(message, registrationIds, 4, function (err, result) {
			res.jsonp(result);
		});
	}, 2000);
*/	
	//res.jsonp("got it ");
}