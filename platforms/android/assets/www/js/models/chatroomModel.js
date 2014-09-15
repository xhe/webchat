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
			util.ajax_get(config.serverUrl+'chatrooms', this.callback, true);
		},
		
		callback: function(data){
			_self.result = data;
			_self.reset();
		},
		
	});
	
	return {
			Chatroom: Chatroom,
			ChatroomCollection: ChatroomCollection,
		   }
});