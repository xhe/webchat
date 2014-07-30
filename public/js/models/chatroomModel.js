define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	Chatroom = Backbone.Model.extend({
		urlRoot: config.serverUrl + 'chatrooms',
	});
	
	ChatroomCollection = Backbone.Collection.extend({
		model: Chatroom,
		url: config.serverUrl + 'chatrooms',
		
		
		getChatrooms: function(){
			_self = this;
			util.ajax_get(config.serverUrl+'chatrooms', this.callback);
		},
		
		callback: function(){
			_self.reset();
		}
		
		
	});
	
	return {
			Chatroom: Chatroom,
			ChatroomCollection: ChatroomCollection
		   }
});