define(function(require){
	
	var Backbone 		= require('backbone'),
		chatroom_tpl		= require('text!tpl/chatrooms.html'),
		chatroom_list_tpl		= require('text!tpl/chatrooms_list.html'),
		util = require('common/utils'),
		Chatroom = require('models/chatroomModel')
		;
		

	// Extends Backbone.View
    var chatRoomsView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( chatroom_tpl );
        	 this.chatroomCollection = new Chatroom.ChatroomCollection();
        },
        events:{
        	"click .back": "back",
        	"click #btnNewChatRoom": "newChatRoom"
        },
        
        newChatRoom: function(){
        	$.mobile.navigate("#newchatroom");
        },
        
        back: function(){
        	window.history.back();
            return false;
        },
        render: function() {           
          	$(this.el).html(this.template({ user: util.getLoggedInUser(), own_rooms: this.chatroomCollection.own_rooms, join_rooms:this.chatroomCollection.join_rooms  }));
            
          	this.chatRoomListView = new ChatRoomListView({ el: $("#divChatRoomList", this.el), model: this.chatroomCollection });
            this.chatroomCollection.getChatrooms();
          	return this;
        }
    });
    
    var ChatRoomListView =  Backbone.View.extend({
    	
    	initialize:function () {
			this.model.bind("reset", this.render, this);
		},
		
		render: function(){
    		$(this.el).html(_.template( chatroom_list_tpl, { own_rooms: this.model.result.own_rooms, join_rooms: this.model.result.join_rooms }));
    		
		}
    });
   
    return chatRoomsView;
   
} );