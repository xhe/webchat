var config = require('../../config/config'),
	_=require("lodash"),
	gcm = require('node-gcm'),
	apn = require("apn"),
	mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	//chat_service = require('./chat'),
	async = require('async');

exports.updateRegistrationId = function(user, reg_id, type, cb){
	
	var findAndResetIOS = function(user, reg_id, cb){
		var resetIOSRegId = function(user, reg_id, client, cb){
			if(user.screenName===client.screenName
				&&
				user.ios_registration_id===reg_id){
				cb(null);
			}else{
				client.ios_registration_id = "";
				client.save(function(err, doc){
					cb(err, doc)
				});
			}
		};
		Client.find({
			ios_registration_id: reg_id,
		})
		.exec(function(err, clients){
			if(err){
				cb(err);
			}else{
				async.map( clients, async.apply(resetIOSRegId, user, reg_id),  function(err){
					cb(err);
				})
			}
		});
	};
	
	var findAndResetAndroid = function(user, reg_id, cb){
		var resetAndroidRegId = function(user, reg_id, client, cb){
			if(user.screenName===client.screenName
					&&
					user.gcm_registration_id===reg_id
					){
				cb(null);
			}else{
				client.gcm_registration_id = "";
				client.save(function(err, doc){
					cb(err, doc)
				});
			}
		};
		
		Client.find({
			gcm_registration_id: reg_id,
		})
		.exec(function(err, clients){
			if(err){
				cb(err);
			}else{
				async.map( clients, async.apply(resetAndroidRegId, user, reg_id ),  function(err){
					cb(err);
				})
			}
		});
	};
	
	if( type=='ios'){
		async.waterfall([
		                 	async.apply( findAndResetIOS, user, reg_id),
		                 	function(){
		                 		user.updateRegistrationId( reg_id, 'ios', cb );	
		                 	}
		                 ], 
		                 function(err, doc){
							cb(err, doc);
						}
		)
	}else{
		async.waterfall([
		                 	async.apply( findAndResetAndroid, user, reg_id),
		                 	function(){
		                 		user.updateRegistrationId( reg_id, 'android', cb );	
		                 	}
		                 ], 
		                 function(err, doc){
							cb(err, doc);
						}
		)
	}
	
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
		if(member.settings_disable_notification && member.settings_disable_notification===true){
		}else
			if(message.creator.screenName!==member.screenName){ 
				receipients.push(member);
			}
	});
	
	if(message.creator.screenName!=room.creator.screenName){
		
		if(room.creator.settings_disable_notification && room.creator.settings_disable_notification===true){
		}else{
			var bExist = false;
			_.each( receipients, function(member){
				if(member.screenName === room.creator.screenName)
					bExist = true;
			})
			if(!bExist)
				receipients.push(room.creator);
		}
	}
	
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
	var ios_id_to_user = {};
	
	_.each(receipients, function(receipient){
			//console.log( receipient.screenName +" gcm:"+receipient.gcm_registration_id +" ios:"+receipient.ios_registration_id)
			if(receipient.gcm_registration_id){
				gcm_registrationIds.push( receipient.gcm_registration_id );
			}
			if(receipient.ios_registration_id){
				ios_registrationIds.push( receipient.ios_registration_id );
				ios_id_to_user[receipient.ios_registration_id] = receipient;
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
		
		if(!apnConnection){
			apnConnection =  new apn.Connection(options); 
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
		}
		
		var notification = new apn.Notification();
		
		async.map(ios_registrationIds, function(ios){
			var receipient = _.find(receipients, function(receipient){
				return receipient.ios_registration_id==ios;
			});
			if(receipient){
				notification.badge = receipient.newMessages;
				if(receipient.settings_disable_sounds && receipient.settings_disable_sounds===true){
					delete notification.sound;
				}else
					notification.sound = "ping.aiff";
			}	
			else
				notification.badge = 1;
			apnConnection.pushNotification(notification, ios);
		});
		
	}
	
	if(gcm_registrationIds.length>0 
			&& config.push_notification.supported_platform_android){
			var message = new gcm.Message({
				    collapseKey: 'Chat4Each Message',
				    delayWhileIdle: false,
				    timeToLive: 3,
				    data: {
				    	title: "Chat4Each",
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