define(function(require){
	
	var Backbone 		= require('backbone'),
		room_chatting_view_tpl		= require('text!tpl/room_chatting_view.html'),
		room_chatting_item_view_tpl		= require('text!tpl/chatrooms_list_item.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		ChatMessageModel = require('models/chatMessageModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		
	var chat_message_event_initialized = false;
	var current_roomId = null;
	// Extends Backbone.View
    var RoomChattingView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( room_chatting_view_tpl );
        	 this.chatMessageCollection = new ChatMessageModel.ChatMessageCollection();
        	  if(window.socket && !chat_message_event_initialized){
        		 window.socket.on('chat_message', 
	        			function(msg){
	        			 	 var chat = JSON.parse(msg);
	        			 	 if(current_roomId === chat.room ){
	        			 		 var oldscrollHeight = $('#messages')[0].scrollHeight;
	        		        	 $('#messages')
			            		 	.append( 
		            		 				$('<li>').html(
		            		 						 _.template( room_chatting_item_view_tpl,
			            		 								  { 
		            		 							 			photoPath: util.retrieveThumbNailPath(chat.creator, 50), 
		            		 							 			chat: chat,
		            		 							 			user: util.getLoggedInUser() 
			            		 								  }
		            		 								  )		
		            		 				)		
		            		 			);
	        		        	 var newscrollHeight = $('#messages')[0].scrollHeight;
	        	        		 if(newscrollHeight > oldscrollHeight){ //COMPARES
	        	        		        $("#messages").scrollTop($("#messages")[0].scrollHeight); //Scrolls
	        	        		  }
	        			 	 }
			        			 
        		 		}
        		 );
        		 chat_message_event_initialized = true;
        	 };
        	 
        },
        
        setRoomId: function(id){
        	current_roomId = id;
        	var _self= this;
        	 setTimeout( function(){
        		 _self.chatMessageCollection.getChatMessages(id);
        	 }, 1 );
        },
       
        events: {
        	"click #btnSubmit": "sendMessage"
        },
        
        sendMessage: function(){
        	var msg = $('#txtMsg').val();
        	$('#txtMsg').val("")
        	this.chatMessageCollection.addChatMessage(current_roomId, msg, function(chat){});
        },
        
        render: function() {           
          	$(this.el).html(this.template({ user: util.getLoggedInUser() }));
          	new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Chatting").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new RoomChattingListView({ model: this.chatMessageCollection});
            return this;
        }
    });
    
    var RoomChattingListView =  Backbone.View.extend({
    	 
    	initialize: function() {
         	 this.model.on('reset', this.render);
         },
         
         render: function(){
        	 this.template = _.template( room_chatting_item_view_tpl );
        	 $('#messages').empty();
        	 while(this.result.length>0){
        		 var chat = this.result.pop();
        		 var photoPath = util.retrieveThumbNailPath(chat.creator, 50);
        		 var oldscrollHeight = $('#messages')[0].scrollHeight;
        		 $('#messages')
        		 	.append( 
        		 				$('<li>').html(this.template({ 
        		 					photoPath: util.retrieveThumbNailPath(chat.creator, 50), 
        		 					chat: chat, 
        		 					user: util.getLoggedInUser() 	
        		 				}))
        		 			);
        		 var newscrollHeight = $('#messages')[0].scrollHeight;
        		 if(newscrollHeight > oldscrollHeight){ //COMPARES
        		        $("#messages").scrollTop($("#messages")[0].scrollHeight); //Scrolls
        		  }
        	 }
         }
    });
    
    return RoomChattingView;
   
} );