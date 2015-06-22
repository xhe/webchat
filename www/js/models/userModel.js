define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	
	User = Backbone.Model.extend({
		urlRoot  : config.serverUrl +'users'
	});
	
	UserCollection =  Backbone.Collection.extend({
		model: User,
		url: config.serverUrl + 'users',
		
		fetchReferer: function(refer_id, cb){
			var _this = this;
			$.get(config.serverUrl+'refer/'+refer_id, function(data){
				cb(data.user);
			});
		},
		
		updateSettings: function(records_forever, records_days, media_days, disable_sounds, language, cb){
			$.post( config.serverUrl+'update_settings', 
					{
						records_forever: records_forever,
						records_days: records_days,
						media_days: media_days,
						disable_sounds:disable_sounds,
						language: language
					},
					function(result){
						cb(result);
					}
			);
		},
		
		refer: function(email, name, message, cb){
			$.post( config.serverUrl+'refer', 
					{
						email: email,
						name: name,
						message: message
					},
					function(result){
						cb(result);
					}
			);
		},
		
		search_users: function(phoneNumber, email, name){
				
			var _this = this;
			$.post( config.serverUrl+'search/contacts', 
					{
						phoneNumber: phoneNumber,
						email: email,
						name: name
					},
					function(result){
						_this.users = result;
						searchedUsers= result;
						_this.reset();
					}
			);
		},
		inviteeId: null,
		
		getRequestedUser: function(id){
			var _this = this;
			this.inviteeId = id;
			$.post( config.serverUrl+'search/contact', 
					{
						userId: id
					},
					function(result){
						if(result.status=='success'){
							_this.user = result.client;
							_this.reset();
						}
					}
			);
		},
		
		invite: function(msg, roomId, is_family, cb){
			$.post( config.serverUrl+'invite/'+this.inviteeId, 
					{
						message: msg,
						roomId: roomId,
						is_family: is_family
					},
					function(result){
						cb(result);
					}
			);
		},
		
		getMember : function(memberId, cb){
			$.get(config.serverUrl+'member/'+memberId, function(data){
				cb( data )
			});
		},
	});
	
	searchedUsers = null;
	
	getRequestedUser = function(id, cb){
		
		if(searchedUsers){
			for(var i=0; i<searchedUsers.length; i++){
				if(searchedUsers[i]._id==id){
					cb(searchedUsers[i]);
				}
			}
			return cb(null);
		}else{
			$.post( config.serverUrl+'search/contact', 
					{
						userId: id
					},
					function(result){
						if(result.status=='success'){
							cb(result.client)
						}
					}
			);
		}
	};
	
	call = function(callee_screenName, type, cb){
		$.post( config.serverUrl+'call', 
				{
					user_name: callee_screenName,
					type: type
				},
				function(result){
					cb(result);
				}
		);
	};
	
	return {
		User: User,
		UserCollection: UserCollection,
		getRequestedUser:getRequestedUser,
		call: call
	}
	
});