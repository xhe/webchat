define(function(require){
	
	var Backbone 		= require('backbone'),
		room_chatting_view_tpl		= require('text!tpl/room_chatting_view.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView')
		;
		

	// Extends Backbone.View
    var RoomChattingView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( room_chatting_view_tpl );
        },
        
        setRoomId: function(id){
        	console.log("setting " + id);
        },
        
        
        events: {
        	"click #btnSubmit": "sendMessage"
        },
        
        sendMessage: function(){
        	window.socket.emit('chat message', $('#txtMsg').val());
        },
        
        render: function() {           
          	$(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Chatting").render();
           
          	return this;
        }
    });
    
   
    return RoomChattingView;
   
} );