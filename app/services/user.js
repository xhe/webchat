var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	crypto = require('crypto'),
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	ChatRoom =mongoose.model('ChatRoom'),
	_ = require("lodash"),
	email_service = require('./email'),
	user_service = require('./user')
	;

exports.createUser = function(req, res){
	
	var updatePwdToken = function(client, updatePwd, updateUser){
		
		if(updatePwd){
			client.password_salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
			client.password=client.hashPassword(client.password);
		}
		
		
		client.save( function(err){
			if(err){
				if(err.code==11000 && String(err).indexOf('screenName') > 0){
					Client.findUniqueUsername(client.screenName, null, function(data){
						res.jsonp({'status':'failed', 'errors': err, 'suggestedName': data});
					});
				}else{
					res.jsonp({'status':'failed', 'errors': err});
				}
			}else{
				updateToken(client, req, res, updateUser);
			}
		});
	};

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

var updateToken = function(user, req, res, userUpdate){
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
				res.jsonp({'status':'success', 'user':client, 'msg':'Your profile has been updated successfully.' });	
			}else{
					//let's send activation email here
					//send activation email here
					if(!client.activated){
						res.jsonp({
							'status':'success', 
							'user':client, 
							'msg':'Your account has not been activated yet, an email will be sent to your email box, please follow the link to activate your account.' });
						email_service.sendActivationEmail(client);
					}else{
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

exports.get_contacts = function(userName, cb){ 
	//first find all rooms owned or participated
	Client.findByUsername(userName, function(err, user){
		if(err)
			console.log(err);
		
		var searchArray =[
			   {
					creator: user
			   },
			   {
				   members: user
			   }
		   ]; 
		//console.log(searchArray)
		var contacts = [];
		ChatRoom
			.find({$or:searchArray})
			.populate('creator')
			.populate('members')
			.exec(function(err, rooms){ //console.log('found rooms '); console.log(user._id); console.log(rooms)
				for(var i=0; i<rooms.length; i++){
					var creator = rooms[i].creator;
					var members = rooms[i].members;
					contacts=_.union(contacts, [creator]);
					contacts=_.union(contacts, members);
				}
				
				var finalContacts = [];
				var ids={};
				_.forEach(contacts, function(contact){ 
					if(contact.screenName!=userName ){
						if( !(contact._id in ids) ){
							ids[contact._id]=0;
							finalContacts.push( utils.simplifyUser(contact, true));
						}
					}
				});
				
				cb( finalContacts )
			});
		}
	);
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

