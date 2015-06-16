var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	crypto = require('crypto'),
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	ChatRoom =mongoose.model('ChatRoom'),
	_ = require("lodash"),
	email_service = require('./email'),
	user_service = require('./user'),
	Refer = mongoose.model('Refer'),
	invitation_service = require('./invitation'),
	Relationship = mongoose.model("Relationship"),
	config = require('../../config/config'),
	Membership = mongoose.model('Membership'),
	async = require('async'),
	relationship_service = require('./relationship')
	;

exports.createUser = function(req, res){
	
	var updatePwdToken = function(client, updatePwd, updateUser, cb){
		
		if(updatePwd){
			client.password_salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
			client.password=client.hashPassword(client.password);
		}
		
		
		client.save( function(err, doc){
			if(err){
				if(err.code==11000 && String(err).indexOf('screenName') > 0){
					Client.findUniqueUsername(client.screenName, null, function(data){
						res.jsonp({'status':'failed', 'errors': err, 'suggestedName': data});
					});
				}else{
					res.jsonp({'status':'failed', 'errors': err});
				}
			}else{
				updateToken(client, req, res, updateUser, cb);
			}
			if(cb){
				cb( err, doc );
			}
			
		});
	};
	
	var createRelationship = function(refer_id, invitee, cb){
		Refer
			.findById(refer_id)
			.populate('from')
			.exec(function(err, doc){
				invitation_service.invite( doc.from, invitee._id, doc.message, null,  
						function(result){
							if(result.status=='failed'){
								cb(result.error);
							}else{
								invitation_service.replyInvitation(invitee, result.content._id, 'accept', '', function(result){
									if(result.status=='failed'){
										cb(result.error);
									}else{
										relationship_service.upsertRelationship(doc.from, invitee, false, function(err, doc){
											relationship_service.upsertRelationship(invitee, doc.from, false, function(err, doc){
												cb(err, invitee)
											});
										});
									}
								},
								true );
							}
						},  
						true );
			});
	};
	
	if( req.body.refer_id && req.body.refer_id.length>0){
		var client = new Client(req.body); //invitee
		async.waterfall([
		                  async.apply( updatePwdToken, client, true, false),
		                  async.apply( createRelationship, req.body.refer_id)
		                 ], 
		                 function(err, doc){ 
							if(err){
								res.jsonp({'status':'failed', 'errors': err });
							}else{
								res.jsonp({'status':'success', 'user': doc });
							}
						 }
		);
	}else{
		if('userId' in req.body){ // this is update
			Client.findById(req.body.userId, function(err, client){
				if(err){
					res.jsonp({'status':'failed', 'errors': err});
				}else{
					client.countryCode = req.body.countryCode;
					client.phoneNumber = req.body.phoneNumber;
					client.firstName = req.body.firstName;
					client.lastName = req.body.lastName;
					client.email = req.body.email;
					client.screenName = req.body.screenName;
					if('password' in req.body && req.body.password.length>0){ 
						client.password = req.body.password;
						updatePwdToken(client, true, true);
					}else{ 
						updatePwdToken(client, false, true);
					}
				}
			});
		}else{
			var client = new Client(req.body); 
			updatePwdToken(client, true, false);
		}
	}
	
};

exports.login = function(req, res){
	Client.findByUsername(req.body.userName, function(err, user){	
		if(err)
			console.log(err);
		if(user){	
			if(user.authenticate(req.body.passWord)){
				updateToken(user, req, res);
			}else{
				res.json({'status':'failed'});
			}
		}else{
			res.json({'status':'failed'});
		}
	});
};

exports.autologin = function(req, res){
	var screenName = req.body.screenName;
	var token = req.body.token;
	if(req.session.screenName && req.session.screenName==screenName 
		&&
	   req.session.token && req.session.token==token 
	){
		res.json({'status':'success'});
	}else{
		Client.findByUsername(screenName,function(err, client){
			if(err)
				console.log(err);
			if(client){
				if(client.token==token){
					client = utils.simplifyUser(client, false);
					req.session.screenName = client.screenName;
					req.session.token = client.token;
					client.thumbFileName = client.getThumb(config.profile_image_sizes[0]);
					req.session.client = client;
					res.jsonp({'status':'success', 'user':client });
				}else{
					res.jsonp({'status':'failed'});
				}
			}else{
				res.jsonp({'status':'failed'});
			}
		});
	}
};

exports.activate = function(email, token, cb){
	user_service.checkEmailTokenValidity(email, token, function(err, user){
		if(err){
			cb(err);
		}else{
			user.activated = Date.now();
			user.save();
			cb(null);
		}
	});
};

var updateToken = function(user, req, res, userUpdate, cb){
	user.updateToken(function(client){ 
		if(client.code){
			res.jsonp({'status':'failed', 'errors': client});
		}else{
			client.password = undefined;
			client.password_salt = undefined;
			client.token_date =undefined;
			client.token_expire_date = undefined;
			req.session.screenName = client.screenName;
			req.session.token = client.token;
			
			if(userUpdate){
				if ( cb)
					cb(null, client);
				else
					res.jsonp({'status':'success', 'user':client, 'msg':'Your profile has been updated successfully.' });	
			}else{
					//let's send activation email here
					//send activation email here
					if(!client.activated){
						if(cb)
							cb(null, client);
						else
							res.jsonp({
								'status':'success', 
								'user':client, 
								'msg':'Your account has not been activated yet, an email will be sent to your email box, please follow the link to activate your account.' });
						email_service.sendActivationEmail(client);
					}else{
						if(cb)
							cb(null, client);
						else
							res.jsonp({'status':'success', 'user':client });
					}
			}
		}
	});	
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {	
	if( req.session.screenName && req.session.token){
		Client.findByUsername(  req.session.screenName, function(err,result){
			if(err)
				console.log(err);
			if(result){ 
				req.user = result;
				next();
			}else{
				return res.send(401, {
					message: 'User is not logged in'
				});
			}
		})
	}else{
		return res.send(401, {
			message: 'User is not logged in'
		});
	}	
};

exports.search_friends = function(criterias, excluded_user, cb){
	Client.search( criterias, function(data){
		var results = [];
		if(excluded_user){
			for(var i=0; i<data.length; i++){
				if(data[i]._id.toString()!=excluded_user._id.toString()){
					results.push(data[i]);
				}
			}
		}else{
			results = data;
		}
		cb(results);
	});
};

exports.search_friend = function(id, cb){
	
	Client.findById( new ObjectId(id), function(err, client){
		if(err){
			cb({ status: 'failed',  error: err })
		}else{
			cb({ status: 'success', client: utils.simplifyUser(client, true) })
		}
	});
};

exports.get_contact = function(user, member_id, cb){
	
	var findClient = function(member_id, cb){
		Client.findOne( { _id: member_id }, function(err, client){
			cb(err, utils.simplifyUser(client, true) )
		});
	};
	
	var havingOneToOneRelationship = function(from, to, cb){
		ChatRoom.find({
			$or:[
				     {
				    	  creator: from ,
				    	  members: to 
				     },
				     {
				    	  creator: to ,
				    	  members: from 
				     }
			     ]
		})
		.exec(function(err, rooms){
			if(err){
				cb(err);
			}else{
				var bOneToOne = false;
				var room="";
				_.each(rooms, function(r){
					if(r.members.length==1){
						bOneToOne = true;
						room = r;
					}
				});
				
				cb(null, { client: to, havingOneToOne: bOneToOne, room : room});
			}
		});
	};
	
	async.waterfall(
			[
				async.apply( findClient, member_id ),
				async.apply( havingOneToOneRelationship, user )
			],
			cb
	);
};

exports.get_contacts = function(userName, cb){
	
	//let's search relationship table
	
	var findByUserName = function(userName, cb){
		Client.findOne(
				{screenName: userName}, 
				function(err, user){
					cb(err, user);
				}
		);
	};
	
	var findRelationships = function(user, cb){
		Relationship.find({
			from: user
		})
		.populate("to")
		.exec(function(err, docs){
			var finalResults = [];
			_.each(docs, function(doc){
				if(doc.to){
					var u = utils.simplifyUser(doc.to, true);
					u.is_family = doc.is_family;
					finalResults.push( u );
				}
			});
			cb(err, finalResults);
		})
	};
	
	async.waterfall([
	                 	async.apply( findByUserName, userName ),
	                 	async.apply( findRelationships)
	                 ], cb);
};

exports.sendResetPwdEmail = function(email, cb){
	if(!utils.isEmail)
		cb("Invalid email format.")
	else
		Client.findByEmail(email, function(err, client){
			if(err){
				cb('Wrong email, none existence.');
			}else{
				if(client){
					cb(null);
					email_service.sendPasswordResetEmail(client);
				}else{
					cb('Wrong email, none existence.');
				}
			}
		});
};


exports.checkEmailTokenValidity = function(email, token, cb){
	Client.findByEmail(email, function(err, user){ 
		if(err){
			cb('Wrong email, none existence');
		}else{
			if(user){
				if(user.token!==token){
					cb('Wrong token, not matching');
				}else{
					cb(null, user);
				}
			}else{
				cb('Wrong email, none existence');
			}
		}
	});
}

exports.updatepassword = function(client, newpassword, cb){
	client.password_salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
	client.password=client.hashPassword(newpassword);
	client.save( function(err){
		if(err){
			cb(err);
		}else{
			client.updateToken(function(client){ 
				cb(null, client);
			});	
		}
	});
};

exports.refer = function(user, email, name, msg, cb){
	Refer.findByEmail(email, function(err, refer){
		if(err){
			cb(err);
		}else{
			if(refer){
				var difSeconds =( new Date().getTime() - refer.created.getTime() )/1000;
				//already sent - check if timedif is good
				if( difSeconds< 3600*24 ){ 
					cb('You have already sent email within last 24 hours, please wait for 24 hours before sending email again.');
				} else {
					//send email here
					cb(null, refer);
					email_service.sendReferalEmail(refer, user);
				}
			} else { 
				var refer = new Refer({
					from: user,
					to: email,
					message: msg,
					name: name
				});
				refer.save( function(err, doc){
					//let's send email here
					cb(null, refer);
					email_service.sendReferalEmail(refer, user );
				});
			}
		}
	});
}

exports.getRefer = function(refer_id, cb){
	Refer
		.findById(refer_id)
		.populate('from')
		.exec(function(err, refer){
			cb(err, refer);
		});
		
}

