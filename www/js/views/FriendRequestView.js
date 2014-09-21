define(function(require){
	
	var Backbone 		= require('backbone'),
		request_friend_tpl		= require('text!tpl/request_friend.html'),
		request_friend_detail_tpl		= require('text!tpl/request_friend_detail.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		User = require('models/userModel')
		;
		

	// Extends Backbone.View
	var FriendRequestView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( request_friend_tpl );
        	 this.userCollection = new User.UserCollection();
        	 window.invRoomId = null;
        },
        
        setContactId: function(id){
        	this.userCollection.getRequestedUser(id);
        },
        
        setContactIdAndRoomId: function(id, roomId){
        	window.invRoomId  = roomId;
        	this.userCollection.getRequestedUser(id);
        },
        
        render: function() {  
        	$(this.el).html(this.template());
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Friend Request").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new FriendRequestDetailView({ el: $("#divRequestFriendDetail", this.el), model: this.userCollection })   
            
            return this;
        }
    } );
    
    var FriendRequestDetailView =  Backbone.View.extend( {
    	
    	 initialize: function() {
    		 this.model.bind("reset", this.render, this);
    	 },
    	  
         events:{
         	"click #btnSendFriendRequest": "sendFriendRequest"
         },
    	 
         sendFriendRequest: function(){
        	 this.model.invite( $("#friendRequestMsg").val(), window.invRoomId , function(result){
        		if(result.status=="success"){
        			util.alert("User invitation has been sent.");
        			$.mobile.navigate("#");
        		}else{
        			util.alert("Following error happened: \n" +result.error );
        		}
        	 });
         },
         
    	 render: function(){
    		 $(this.el).html(_.template( request_friend_detail_tpl, { 'contact': this.model.user,  serverUrl: (window.hostURL?window.hostURL:"")  }));
    		 $("#friendRequestMsg").textinput().textinput("refresh");
    		 $( "#btnSendFriendRequest" ).button().button( "refresh" );
    	 }
    	 
    	
    });
   
    return FriendRequestView;
   
} );