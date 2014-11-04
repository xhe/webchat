var config = require('../../config/config'),
	_=require("lodash"),
	gcm = require('node-gcm');

exports.updateRegistrationId = function(user, reg_id, type, cb){
	user.updateRegistrationId( reg_id, type, cb );
};

exports.sendInvitation = function(invitation){
	var msg =  invitation.from.firstName+" "+invitation.from.lastName +" sent you an invitation";
	sendNotificationMsg([invitation.to], msg, function(err, result){
		if(err){
			console.log("Error: ");
			console.log(err);
		}else{
			//console.log(result);
		}
	});
};

exports.broadcastChatMessage = function(message, room){
	
	var receipients = [];
	
	_.forEach( room.members, function(member){
		if(message.creator._id!==member._id){
			receipients.push(member);
		}
	});
	if(message.creator._id!=room.creator._id)
		receipients.push(room.creator);
	
	var msg =  message.creator.firstName+" "+ message.creator.lastName+": "+message.message;
	sendNotificationMsg(receipients, msg, function(err, result){
		if(err){
			console.log("Error: ");
			console.log(err);
		}else{
			//console.log(result);
		}
	});
	
};


var sendNotificationMsg = function(receipients, msg, cb){
	
	if(receipients.length==0 || msg=="")
		return;
	
	var gcm_registrationIds = []; 
	
	_.each(receipients, function(receipient){
			if(receipient.gcm_registration_id){
				gcm_registrationIds.push( receipient.gcm_registration_id );
			}
	});
	
	if(gcm_registrationIds.length>0 
			&& config.push_notification.supported_platform_android){
			var message = new gcm.Message({
				    collapseKey: 'Chat4Each Message',
				    delayWhileIdle: true,
				    timeToLive: 3,
				    data: {
				    	message: msg 
				    }
			});
			var sender = new gcm.Sender(config.push_notification.gcm_api_key);
			try{
				sender.send(message, gcm_registrationIds, 4, function (err, result) {
					if(cb)
						if(err){
							cb(err);
						}	
						else{
							cb(null, result);
						}
				});
			}catch(exception){
				console.log( exception )
			}
	}
	
}