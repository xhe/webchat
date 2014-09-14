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
		roomId: null,
		
		getChatMessages: function(roomId){
			this.roomId = roomId;
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
		
		fetchPrev: function(cb){
			
			if(this.result.length>0){
				_self = this;
				var oldestedTime = this.result[ this.result.length-1 ].created;
				util.ajax_get(config.serverUrl+'chatmessages/'+this.roomId +'/'+oldestedTime, 
				function(data){
					_self.result = data;
					cb(data);
				}, 
				true);
			}
		},
		
		fetchNext: function(cb){
			cb([])
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