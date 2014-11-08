var config = require('../../config/config'),
	_=require("lodash"),
	gcm = require('node-gcm'),
	apns = require("apns");

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
	var ios_registrationIds = [];
	
	_.each(receipients, function(receipient){
			if(receipient.gcm_registration_id){
				gcm_registrationIds.push( receipient.gcm_registration_id );
			}
			if(receipient.ios_registration_id){
				ios_registrationIds.push( receipient.gcm_registration_id );
			}
	});
	
	
	if(ios_registrationIds.length>0 
			&& config.push_notification.supported_platform_ios){
		
		options = {
				   keyFile : config.push_notification_ios_files.keyFile,
				   certFile :  config.push_notification_ios_files.certFile,
				   debug : config.push_notification_ios_files.debug
				};
		var connection = new apns.Connection(options);
		var notification = new apns.Notification();
		_.each(ios_registrationIds, function(ios_registrationId){
			notification.device = new apns.Device(ios_registrationId);
			notification.alert = msg;
			connection.sendNotification(notification);
		});
	}
	
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