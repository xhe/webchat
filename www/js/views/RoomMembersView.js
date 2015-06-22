define(function(require){
	
	var Backbone 		= require('backbone'),
		members_tpl	= require('text!tpl/room_members.html'),
		member_item_tpl = require('text!tpl/room_member_item.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		util = require('common/utils'),
		Chatroom = require('models/chatroomModel')
		;
	
	var  appendMemberItem = function(member, bCreator){
			$('#divRoomMembers')
			     		 	.append( 
			 		 				$('<div>').html(
			 		 						 _.template( member_item_tpl,
			     		 								  { 
			 		 							 			photoPath:util.retrieveThumbNailPath(member, 100),
			 		 							 			member: member,
			 		 							 			mobile: window.platform?true:false,
			 		 							 			bCreator: bCreator,
			 		 							 			self: util.getLoggedInUser()._id==member._id
			     		 								  }
			 		 								  )		
			 		 				)		
			 		 			);
      };
	
	// Extends Backbone.View
    var RoomMembersView = Backbone.View.extend( {
    	
    	roomId: null,
        initialize: function(roomId) {
        	 this.template = _.template( members_tpl );
        	 if(roomId){
         		this.roomId = roomId;
         	}
        },
        
        events: {
        	"click .divRoomMemberItem": "showMember"
        },
        
        showMember: function(event){
        	window.location = "#room_member/"+event.currentTarget.getAttribute('data-memberid');
        },
        
        render: function() { 
        		
        		$(this.el).html(this.template({ user: util.getLoggedInUser(), roomId: this.roomId }));
	            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(util.translate("Members")).render();
	            new FooterView({ el: $(".footerContent", this.el)}).render();
		        
	            Chatroom.getRoom( this.roomId, function(room){
		        	  setTimeout( function(){
		        		  appendMemberItem(room.creator, true);
			            	_.each( room.members, function(member){
			            		appendMemberItem(member, false);
			            	}); 
		        	  }, 1);
		          });
	           return this;
        }
    } );
    
    
    return RoomMembersView;
   
});
