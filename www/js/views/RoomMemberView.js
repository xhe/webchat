define(function(require){
	
	var Backbone 		= require('backbone'),
		members_tpl	= require('text!tpl/room_member.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		util = require('common/utils'),
		UserModel = require('models/UserModel'),
		member_detail_tpl	= require('text!tpl/room_member_detail.html')
		;


	
	// Extends Backbone.View
    var RoomMemberView = Backbone.View.extend( {
    	
    	memberId: null,
        initialize: function(memberId) {
        	 this.template = _.template( members_tpl );
        	 if(memberId){
         		this.memberId = memberId;
         	}
        	this.userCollection = new UserModel.UserCollection();
        },
        
        render: function() { 
        		$(this.el).html(this.template({ user: util.getLoggedInUser() }));
	            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Member Detail").render();
	            new FooterView({ el: $(".footerContent", this.el)}).render();
	            this.userCollection.getMember( this.memberId, function(data){
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
		          });
	           return this;
        }
    } );
    
    
    return RoomMemberView;
   
});
