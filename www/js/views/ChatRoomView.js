define(function(require){
	
	var Backbone 		= require('backbone'),
		chatroom_tpl		= require('text!tpl/chatrooms.html'),
		chatroom_list_tpl		= require('text!tpl/chatrooms_list.html'),
		util = require('common/utils'),
		Chatroom = require('models/chatroomModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
	
	var user_on_off_line_event_initialized = false;
	var chatroomCollection = null;
		

	// Extends Backbone.View
    var chatRoomsView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( chatroom_tpl );
        	 chatroomCollection = new Chatroom.ChatroomCollection();
        	 
        	 if(!user_on_off_line_event_initialized){
        		 _self = this;
        		 window.socketEventService.on(window.socketEventService.EVENT_NOTIFY_MEMBER_ON_LINE,
        				function(){
        			 		chatroomCollection.reset();
        		 		}
        		 );
        		 
        		 window.socketEventService.on(window.socketEventService.EVENT_NOTIFY_MEMBER_OFF_LINE,
     				 	function(){
        			 		chatroomCollection.reset();
     		 			}
        		 );
        		 
        		 user_on_off_line_event_initialized = true;
        	 }
        	 
        	 
        },
        events:{
        	"click #btnNewChatRoom": "newChatRoom",
        	"click .hrefDeleteRoom": "deleteChatRoom"
        },
        
        deleteChatRoom: function(event){
        	if(confirm("Are you sure you want to "+ event.target.getAttribute("data-action") +" this chatroom?")){
        		var room = new Chatroom.Chatroom({
        			id: event.target.getAttribute("data-roomid")
        		});
        		self=this;
        		room.destroy(
        				{
        					type: 'DELETE',
        					success: function(model, response) {
        						chatroomCollection.getChatrooms();
        					}
        				}
        		);
        	}
        },
        
        newChatRoom: function(){
        	$.mobile.navigate("#newchatroom");
        },
       
        render: function() {           
          	$(this.el).html(this.template({ user: util.getLoggedInUser() }));
          	new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Chat Rooms").render();
          	new FooterView({ el: $(".footerContent", this.el)}).render();
            
          	this.chatRoomListView = new ChatRoomListView({ el: $("#divChatRoomList", this.el), model: chatroomCollection });
            chatroomCollection.getChatrooms();
          	return this;
        }
    });
    
    var ChatRoomListView =  Backbone.View.extend({
    	
    	initialize:function () {
			this.model.bind("reset", this.render, this);
		},
		
		render: function(){
			
			_.each(this.model.result.own_rooms, function(room){
				room.creator.headImg = util.retrieveThumbNailPath( room.creator, 50);
				room.creator.isOnline = window.socketEventService.isUserOnline(room.creator);
				room.membersToRender = [room.creator];
				_.each(room.members, function(member){
					member.headImg = util.retrieveThumbNailPath( member, 50);
					member.isOnline = window.socketEventService.isUserOnline(member);
					if(room.membersToRender.length<5)
						room.membersToRender.push(member);
				});
			});
			
			_.each(this.model.result.join_rooms, function(room){
				room.creator.headImg = util.retrieveThumbNailPath( room.creator, 50);
				room.creator.isOnline = window.socketEventService.isUserOnline(room.creator);
				room.membersToRender = [room.creator];
				_.each(room.members, function(member){
					member.headImg = util.retrieveThumbNailPath( member, 50);
					member.isOnline = window.socketEventService.isUserOnline(member);
					if(room.membersToRender.length<5 /*&& member._id!== util.getLoggedInUser()._id*/)
						room.membersToRender.push(member);
				});
			});
			
			
    		$(this.el).html(_.template( chatroom_list_tpl, 
    				{ own_rooms: this.model.result.own_rooms, 
    				join_rooms: this.model.result.join_rooms, 
    				user: util.getLoggedInUser(),
    				showMemberHeadImg: util.showMemberHeadImg,
    				showMemberHeadImgForChatRoom: util.showMemberHeadImgForChatRoom
    				}));
    		$( ".listview" ).listview().listview( "refresh" );
    		
		}
    });
   
    return chatRoomsView;
   
} );