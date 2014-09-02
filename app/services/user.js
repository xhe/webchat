var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	crypto = require('crypto'),
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	ChatRoom =mongoose.model('ChatRoom'),
	_ = require("lodash")
	;

exports.createUser = function(req, res){
	var client = new Client(req.body);
	
	client.password_salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
	client.password=client.hashPassword(client.password);
	
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
			updateToken(client, req, res);
		}
	});
};

exports.login = function(req, res){
	Client.findByUsername(req.body.userName, function(user){		
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
		Client.findByUsername(screenName,function(client){
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


var updateToken = function(user, req, res){
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
			res.jsonp({'status':'success', 'user':client });
		}
	});	
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {	
	if( req.session.screenName && req.session.token){
		Client.findByUsername(  req.session.screenName, function(result){
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
	Client.findByUsername(userName, function(user){
		var searchArray =[
			   {
					creator: user
			   },
			   {
				   members: [user]
			   }
		   ]; 
		var contacts = [];
		ChatRoom
			.find({$or:searchArray})
			.populate('creator')
			.populate('members')
			.exec(function(err, rooms){
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
