var country_service =  require('../services/country');
var user_service =  require('../services/user');
var core_service =   require('../services/core');
var chat_service = require('../services/chat');
var invitation_service = require('../services/invitation');

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
	req.user.getMyOwnChatrooms(function(rooms){
		ownRooms = rooms;
		req.user.getMyParticipatedChatrooms(function(rooms){
			res.jsonp({own_rooms: ownRooms, join_rooms: rooms});
		})
	});
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
				email: req.body.email
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
	chat_service.invite(req.user, inviteeId, msg, function(data){
		res.jsonp(data);
	});
}

exports.received_pending_invitations = function(req, res){
	invitation_service.getMyInvitation(req.user, invitation_service.STATUS_PENDING, function(data){
		res.jsonp(data);
	});
}


