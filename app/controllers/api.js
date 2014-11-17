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

exports.upload_chat_audio_file = function(req, res){ console.log( req.files );
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
	push_notification_service.updateRegistrationId(req.user, regId, req.body.type, function(data){
		res.jsonp(data);
	});
}

exports.ios_register = function(req, res){ 
	push_notification_service.updateRegistrationId(req.user, req.body.regId, req.body.type, function(data){
		res.jsonp(data);
	});
}

exports.sendemail = function(req, res){
	var nodemailer = require('nodemailer');
	var smtpTransport = require('nodemailer-smtp-transport');
	var directTransport = require('nodemailer-direct-transport');
	var transporter = nodemailer.createTransport(directTransport());
	transporter.sendMail({
	    from: 'admin@chat4each.com',
	    to: 'hexufeng@gmail.com',
	    subject: 'hello',
	    text: 'hello world!'
	},
	function(err, info){
		if(err){
			console.log(err);
		}else{
			console.log('sent ' + info.response)
		}
	}
	);
	
	/*
	var transporter = nodemailer.createTransport();
	transporter.sendMail({
	    from: 'admin@chat4each.com',
	    to: 'hexufeng@gmail.com',
	    subject: 'hello',
	    text: 'hello world!'
	},
	function(err, info){
		if(err){
			console.log(err);
		}else{
			console.log('sent ' + info.response)
		}
	}
	);
	
	var transport = nodemailer.createTransport(smtpTransport({
	    host: 'mail.jobascareer.com',
	    port: 25,
	    auth: {
	        user: 'chat4each',
	        pass: '179100'
	    }
	}));
	
	transport.sendMail({
	    from: 'hexufeng@gmail.com',
	    to: 'support@chat4each.com',
	    subject: 'hello',
	    text: 'hello world!'
	},
	function(err, info){
		if(err){
			console.log(err);
		}else{
			console.log('sent ' + info.response)
		}
	}
	);
	*/
	
	
}
