define(function(require){
	
	var Backbone 		= require('backbone'),
		new_chatroom_tpl		= require('text!tpl/new_chatroom_view.html'),
		util = require('common/utils'),
		Chatroom = require('models/chatroomModel')
		;
		

	// Extends Backbone.View
    var newChatroomView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( new_chatroom_tpl );
        },
        events:{
        	"click .back": "back",
        	"click #btnSubmitNewChatRoom": "createNewRoom"
        },
        
        createNewRoom: function(){
        	var title = $("#txtChatRoomTitle").val();
        	var description = $("textarea#txtChatRoomDesc").val();
        	var room = new Chatroom.Chatroom({
        		title: title,
        		description: description
        	});
        	room.save(
	        			{},
	        			{
	        			  success: function(model, response){
	        			    if(response.status=='success'){
	        			    	alert("Chat room has been added successfully.");
	        			    	window.history.back();
	        			    }else{
	        			    	alert(response.message);
	        			    }
	        			  },
	        			  error: function(){
	        			    alert("error happened");
	        			  }
	        			}
        			);
        },
        
        back: function(){
        	window.history.back();
            return false;
        },
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            return this;
        }
    } );
      
   
    return newChatroomView;
   
} );