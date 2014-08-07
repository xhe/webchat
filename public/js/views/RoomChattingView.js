define(function(require){
	
	var Backbone 		= require('backbone'),
		room_chatting_view_tpl		= require('text!tpl/room_chatting_view.html'),
		util = require('common/utils')
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
        
        
        render: function() {           
          	$(this.el).html(this.template({ user: util.getLoggedInUser() }));
          	return this;
        }
    });
    
   
    return RoomChattingView;
   
} );