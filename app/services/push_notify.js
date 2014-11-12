var config = require('../../config/config'),
	_=require("lodash"),
	gcm = require('node-gcm'),
	apn = require("apn");

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
	
	var msg = message.message;
	if(message.photo){
		msg = "uploaded an image";
	}else if(message.audio){
		msg = "voice recording";
	}else if(message.video){
		msg = "video recording";
	}
	
	var msg =  message.creator.firstName+" "+ message.creator.lastName+": "+ msg;
	sendNotificationMsg(receipients, msg, function(err, result){
		if(err){
			console.log("Error: ");
			console.log(err);
		}else{
			//console.log(result);
		}
	});
	
};

var apnConnection = null;

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
				ios_registrationIds.push( receipient.ios_registration_id );
			}
	});
	
	
	if(ios_registrationIds.length>0 
			&& config.push_notification.supported_platform_ios){
		
		options = {
				gateway:config.push_notification_ios_files.gateway,
				cert: config.push_notification_ios_files.certFile,
				key: config.push_notification_ios_files.keyFile,
				passphrase: config.push_notification_ios_files.passphrase
				};
		if(!apnConnection)
			apnConnection =  new apn.Connection(options); 
		
		var notification = new apn.Notification();
		
		apnConnection.on('connected', function() {
		    console.log("Connected");
		});

		apnConnection.on('transmitted', function(notification, device) {
		    console.log("Notification transmitted to:" + device.token.toString('hex'));
		});

		apnConnection.on('transmissionError', function(errCode, notification, device) {
		    console.error("Notification caused error: " + errCode + " for device ", device, notification);
		    if (errCode == 8) {
		        console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
		    }
		});

		apnConnection.on('timeout', function () {
		    console.log("Connection Timeout");
		    apnConnection = null;
		});

		apnConnection.on('disconnected', function() {
		    console.log("Disconnected from APNS");
		    apnConnection = null;
		});

		apnConnection.on('socketError', function(e){
				console.log(e);
				apnConnection = null;
			}
		);
		
		notification.alert = msg;
		notification.badge = 1;
		notification.sound = "ping.aiff";
		apnConnection.pushNotification(notification, ios_registrationIds);
		
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