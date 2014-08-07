define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	//var util = require('common/utils');
	
	User = Backbone.Model.extend({
		urlRoot  : config.serverUrl +'users'
	});
	
	UserCollection =  Backbone.Collection.extend({
		model: User,
		url: config.serverUrl + 'users',
		
		search_users: function(phoneNumber, email){
				
			var _this = this;
			$.post( config.serverUrl+'search/contacts', 
					{
						phoneNumber: phoneNumber,
						email: email
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
		
		invite: function(msg, cb){
			$.post( config.serverUrl+'invite/'+this.inviteeId, 
					{
						message: msg
					},
					function(result){
						cb(result);
					}
			);
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
	
	return {
		User: User,
		UserCollection: UserCollection,
		getRequestedUser:getRequestedUser
	}
	
});