define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	var rooms = null;
	
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
			rooms = data;
			_self.reset();
		},
		
	});
	
	getRooms = function(cb){
		if(rooms){
			cb(rooms);
		}else{
			util.ajax_get(config.serverUrl+'chatrooms', function(data){
				cb(rooms);
			}, true);
		}
	};
	
	return {
			Chatroom: Chatroom,
			ChatroomCollection: ChatroomCollection,
			getRooms: getRooms
		   }
});