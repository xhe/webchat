define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	ChatMessage = Backbone.Model.extend({
		urlRoot: config.serverUrl + 'chatmessages',
	});
	
	ChatMessageCollection = Backbone.Collection.extend({
		model: ChatMessage,
		url: config.serverUrl + 'chatmessages',
		
		getChatMessages: function(roomId){
			_self = this;
			util.ajax_get(config.serverUrl+'chatmessages/'+roomId, this.callback, true);
		},
		
		addChatMessage: function(roomId, msg, cb){
			var _this = this;
			$.post( config.serverUrl+'chatmessages', 
					{
						roomId: roomId,
						message: msg
					},
					function(result){
						cb(result);
					}
			);
		},
		
		callback: function(data){
			_self.result = data;
			_self.reset();
		},
		
	});
	
	return {
		ChatMessage: ChatMessage,
		ChatMessageCollection: ChatMessageCollection,
		   }
});