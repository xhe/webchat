'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto'),
	config = require('../../config/config'),
	 _ = require('lodash'),
	 utils = require('../services/utils'),
	 path = require('path'),
	 async = require('async')
	;
var ObjectId = require('mongoose').Types.ObjectId; 
var ChatRoom = mongoose.model('ChatRoom');
var Invitation = mongoose.model('Invitation');

var PhotoRenderSchema = new Schema({
	filename: String,
	dimension: Number
});

var PhotoSchema = new Schema({
	filename: String,
	use_as_head: Boolean,
	title: String,
	description: String,
	renders: [ PhotoRenderSchema ],
});

PhotoSchema.pre('remove', function (doc) {
	var path_original = __dirname+'/../../www/uploads/original/';
	var path_thumb =  __dirname+'/../../www/uploads/thumb/';
	if(doc.filename)
		if(fs.existsSync( path.join(path_original,doc.filename) ))
			fs.unlinkSync(path.join(path_original,doc.filename) );
			_.forEach(doc.renders, function(render){
				if(fs.existsSync(path.join(path_thumb,render.filename )))
					fs.unlinkSync(path.join(path_thumb,render.filename));
			});
});


var UserSchema = new Schema({
	 
	countryCode: {
		type: Number,
		required: 'Country code cannot be blank'
	},
	
	phoneNumber: {
		type: String,
		required: 'Phone number cannot be blank',
		index: true
	},
	
	firstName: {
		type: String,
		default: '',
		trim: true,
		required: 'First name cannot be blank'
	},
		
	lastName: {
		type: String,
		default: '',
		trim: true,
		required: 'Last name cannot be blank'
	},
	
	email: {
		type: String,
		trim: true,
		default: '',
		required: 'Please fill in your email',
		match: [/.+\@.+\..+/, 'Please fill a valid email address'],
		unique: true,
		index: true
	},
	
	screenName: {
		type: String,
		default: '',
		trim: true,
		required: 'Screen name cannot be blank',
		unique: true
	},
	
	password: {
		type: String,
		default: '',
		trim: true,
		required: 'Password cannot be blank'
	},
	
	password_salt: {
		type: String,
		default: '',
		trim: true
	},
	
	token:{
		type: String,
		default: '',
		index: true
	},
	
	token_date:{
		type: Date,
		default: Date.now
	},
	
	token_expire_date:{
		type: Date,
		default: Date.now
	},
	
	photos: [ PhotoSchema ],
	
	settings_records_forever: {
		type: Boolean,
		default: false
	},
	settings_records_days: {
		type: Number,
		default: 30
	},
	settings_media_days: {
		type: Number,
		default: 30
	},
	settings_disable_sounds: {
		type: Boolean,
		default: false
	},
	
	thumbFileName: {
		type: String,
		default: ''
	},
	
	gcm_registration_id: {
		type: String,
		default: '',
		required: false
		
	},
	ios_registration_id:{
		type: String,
		default: '',
		required: false
	},
	created: {
		type: Date,
		default: Date.now
	},
	activated: {
		type: Date
	},
	processed:{
		type: Date
	},
		
});

UserSchema.pre('save', function (next) {
	this.phoneNumber = this.phoneNumber.toString().replace( /^\D+/g, '');
	if(this.phoneNumber==""){
		self.invalidate("phoneNumber", "Phone number must have digits");
		next(new Error("Phone number must have digits."));
	}else{
		next();
	}
});

UserSchema.methods.hashPassword = function(password){
	if(this.password_salt && password){		
		return crypto.pbkdf2Sync( password, this.password_salt, 1000, 64 ).toString('base64');
	}else{
		return password;
	}
};

UserSchema.methods.authenticate = function(password){
	var result = this.password == this.hashPassword(password);
	return result;
};

UserSchema.statics.findByUsername = function(screenName, cb){
	this.findOne({screenName: screenName}, function(err, user){
		if(!err && user){ 
			cb(null, user);
		}else{
			cb(err);
		}
	});
};

UserSchema.statics.findByEmail = function(email, cb){
	this.findOne({email: email}, function(err, user){
		if(!err && user){ 
			cb(null, user);
		}else{
			cb(err);
		}
	});
};

UserSchema.statics.search = function(criterias, cb){
	var searchArray = [];
	for (var key in criterias){
		if( criterias[key].length>0 ){
			var tmp = {};
			tmp[key] = criterias[key];
			searchArray.push(tmp);
		}
	}
	this.find({ $or: searchArray }, function(err, users){
		if(err){
			console.log(err);
		}else{
			var results = [];
			_.forEach(users, function(user){
				results.push( utils.simplifyUser(user, true));
			});
			cb(results);
		}
	});
};


UserSchema.methods.getThumb = function(dimension){
	for(var i=0; i<this.photos.length; i++){
		if(this.photos[i].use_as_head){
			for(var j=0;j<this.photos[i].renders.length;j++){
				if(this.photos[i].renders[j].dimension == dimension){
					return this.photos[i].renders[j].filename;
				}
			}
		}
	}
	return "";
},

UserSchema.methods.updateToken = function(cb, valid_period){
	this.token = crypto.createHash("md5").update(this.screenName+":"+ this.phoneNumber+ ":"+ this.email +":" + Date.now()).digest('hex');
	var now = new Date().getTime();
	this.token_date = new Date(now);
	if(valid_period == undefined){
		this.token_expire_date = new Date(now+config.default_token_length*1000);
	}else{
		this.token_expire_date = new Date(now+valid_period*1000);
	}
	//var fn = this.getThumb(config.profile_image_sizes[0]);
	//this.thumbFileName = fn?fn:'../../img/nobody_32.png';
	this.thumbFileName = this.getThumb(config.profile_image_sizes[0]);
	var _this=this
	this.save(function(err){
		if(err){
			cb(err);
		}else{
			cb(_this);
		}
	});
};

UserSchema.methods.updateRegistrationId = function(registration_id, type, cb){
	
	if(type=='android'){
		this.gcm_registration_id = registration_id;
	}
	if(type=='ios'){
		this.ios_registration_id = registration_id;
	}
	var _this=this
	this.save(function(err){
		if(err){
			cb(err);
		}else{
			cb(_this);
		}
	});

};

UserSchema.statics.findUniqueUsername = function(screenName, suffix,callback){
	var _this=this;
	var possibleScreenName = screenName + ( suffix||'' );
	_this.findOne(
			{screenName: possibleScreenName}, 
			function(err, user){
				if(!err){
					if(!user)
					{
						callback(possibleScreenName);
					} else {
							return _this.findUniqueUsername(screenName, (suffix||0)+1, callback );
					}
				}else{
					callback(null);
				}	
			}
	);
};

UserSchema.methods.removePhoto = function(photoIds, callback){
	
	var path_original = __dirname+'/../../www/uploads/original/';
	var path_thumb =  __dirname+'/../../www/uploads/thumb/';
	var _self = this;
	var _removePhoto = function(photoId, cb){
		var photo = _self.photos.id(photoId);
		if(fs.existsSync( path.join(path_original,photo.filename) ))
				fs.unlink(path.join(path_original,photo.filename) );
				_.forEach(photo.renders, function(render){
					if(fs.existsSync(path.join(path_thumb,render.filename )))
						fs.unlink(path.join(path_thumb,render.filename));
				});
		_self.photos.pull({ _id: new ObjectId(photoId )});
		cb(null);
	};
	async.map( photoIds, _removePhoto, function(err, results){
		_self.save( function(err, doc){
			callback(err, doc);
		})
	});

};

UserSchema.methods.updateDefaultHead = function(photoId, callback){
	
	var start = 0;
	var _self = this;
	
	var updateOnePhoto = function(){
		var photo = _self.photos[start];
		var use_as_head = false;
		if(photo._id == photoId){
			use_as_head = true;
		}
		
		var _photo = _self.photos.id(photo._id);
		_photo.use_as_head = use_as_head;
		_self.save(function(err){
			if(err){
				console.log(err);
			}else{
				start++;
				if(start == _self.photos.length){
					callback();
				}else{
					updateOnePhoto()
				}	
			}
		});
	};
	updateOnePhoto();
};

UserSchema.methods.updatePhotoDescription = function(photoId, title, description, callback){
	var photo = this.photos.id(photoId);
	photo.title = title;
	photo.description = description;
	this.save(function(err){
		if(err){
			console.log(err);
		}else{
			callback();
		}
	});
};

UserSchema.methods.createChatRoom = function(title, description, cb){
	var _this = this;
	ChatRoom.find({creator: this, name:title}).exec(function(err, chatrooms){
		
		if(chatrooms.length>0){
			cb({status:"failed", message:"name is used already, please select another name."});
		}else{
			var room = new ChatRoom({
				name: title,
				creator: _this,
				description: description,
			});
			room.save(function(err){
				if(err){
					cb({status:"failed", error: err});
				}else{
					cb({status:"success", content: room });
				}
			});
		}
	});
};

UserSchema.methods.deleteChatRoom = function(roomId, cb){
	var _this=this;
	
	ChatRoom.findById( new ObjectId(roomId), function(err,room){
		if(err){
			cb({status: 'failed', error: err})
		}else{
			if(room.creator.toString()!=_this._id.toString()){
				//if not creator, we jsut remove from room members
				//room.members.id( new ObjectId(_this._id)).remove();
				for(var i=0; i<room.members.length;i++){
					if(room.members[i].toString()==_this._id.toString()){
						room.members.splice(i,1);
						room.save(function(){
							cb({status:"success"});
						})
						break;
					}
				}
			}else{
				room.remove(function(err){
					if(err){
						cb({status: 'failed', error: err})
					}else{
						cb({status:"success"});
					}
				})
			}
		}
	});
}; 

mongoose.model('Client', UserSchema);
mongoose.model('PhotoSchema', PhotoSchema);
mongoose.model('PhotoRenderSchema', PhotoRenderSchema);
