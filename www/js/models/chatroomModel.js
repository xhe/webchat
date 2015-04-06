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
		
		shareLinkToRoom: function(room_id, link_id, cb){
			$.post( config.serverUrl+'sharelinktoroom', 
					{
						link_id: link_id,
						room_id: room_id
					},
					function(result){
						cb(result);
					}
			);
		},
		
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
				cb(data);
			}, true);
		}
	};
	
	getRoom = function(roomId, cb){
		
		getRooms(function(rooms){
			var r = null;
			_.each(rooms['join_rooms'], function(room){
				if(room._id==roomId)
					r = room;
			});
			if(r==null){
				_.each(rooms['own_rooms'], function(room){
					if(room._id==roomId)
						r = room;
				});
			};
			cb(r);
		});
		
	};
	
	return {
			Chatroom: Chatroom,
			ChatroomCollection: ChatroomCollection,
			getRooms: getRooms,
			getRoom: getRoom
		   }
});