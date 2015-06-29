define(function(require){
	
	var Backbone 		= require('backbone'),
		members_tpl	= require('text!tpl/room_member.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		util = require('common/utils'),
		UserModel = require('models/userModel'),
		member_detail_tpl	= require('text!tpl/room_member_detail.html')
		;


	
	// Extends Backbone.View
    var RoomMemberView = Backbone.View.extend( {
    	
    	memberId: null,
    	room: null,
    	member: null,
    	
        initialize: function(memberId) {
        	 this.template = _.template( members_tpl );
        	 if(memberId){
         		this.memberId = memberId;
         	}
        	this.userCollection = new UserModel.UserCollection();
        },
        
        events: {
        	"click #btnMemberDetail_send_msg": "sendMsg",
        	"click #btnMemberDetail_inv_private": "invite",
        	"click #btnMemberDetail_list_highlights": "listHiglights"
        },
        
        sendMsg: function(){
        	window.location="#chatroom/"+room._id;
        },
        
        invite: function(){
        	window.location="#request_friend/"+this.memberId;
        },
        
        listHiglights: function(){
        	window.location="#highlights/"+window.room_member.screenName+"/null/null";
        },
        
        render: function() { 
        		$(this.el).html(this.template({ user: util.getLoggedInUser() }));
	            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(util.translate("Member Detail")).render();
	            new FooterView({ el: $(".footerContent", this.el)}).render();
	            
	            this.userCollection.getMember( this.memberId, function(data){
	            	room = data.result.room;
	            	window.room_member = data.result.client;
		        	  $('#divRoomMemberDetail')
		        		  	.html(
		        		  			_.template( member_detail_tpl,
	   		 								  {	
		        		  							photoPath:util.retrieveThumbNailPath(data.result.client, 500),
			 							 			member: data.result.client,
			 							 			mobile: window.platform?true:false,
			 							 			related: data.result.havingOneToOne
	   		 								  }
		 								  )				
		        		  	
		        		);
		        	$(".btn").button().button('refresh');
		          });
	           return this;
        }
    } );
    
    
    return RoomMemberView;
   
});
