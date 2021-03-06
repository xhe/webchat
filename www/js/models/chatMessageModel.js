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
		latestTime: null,
		
		removeMsg: function(msgId, cb){
			
			$.ajax({
		        type: "DELETE",
		        url: config.serverUrl + 'chatmessages',
		        data: {
		        	msgId: msgId
		        },
		        success: function(data){
		        	cb(data)
		        }
		        });
			
		},
		
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
						_this.latestTime = result.created;
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
		
		fetchNew: function(cb){
			if(this.latestTime){
				_self = this; 
				util.ajax_get(config.serverUrl+'chatmessages_after/'+this.roomId +'/'+this.latestTime, 
						function(data){
							_self.latestTime = data[0].created;
							cb(data);
						}, 
						true);
			}
		},
		
		callback: function(data){
			if( data.length==0){
				_self.latestTime = null
				_self.result = [];
			}else{
				_self.latestTime = data[0].created;
				_self.result = data;
			}
			_self.reset();
		},
		
	});
	
	return {
		ChatMessage: ChatMessage,
		ChatMessageCollection: ChatMessageCollection,
		   }
});