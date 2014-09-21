define(function(require){
	
	var Backbone 		= require('backbone'),
		new_chatroom_tpl		= require('text!tpl/new_chatroom_view.html'),
		util = require('common/utils'),
		Chatroom = require('models/chatroomModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		

	// Extends Backbone.View
    var newChatroomView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( new_chatroom_tpl );
        },
        events:{
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
	        			    	util.alert("Chat room has been added successfully.");
	        			    	window.history.back();
	        			    }else{
	        			    	util.alert(response.message);
	        			    }
	        			  },
	        			  error: function(){
	        				  util.alert("error happened");
	        			  }
	        			}
        			);
        },
       
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Create Room").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            return this;
        }
    } );
      
   
    return newChatroomView;
   
} );