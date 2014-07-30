define(function(require){
	
	var Backbone 		= require('backbone'),
		new_chatroom_tpl		= require('text!tpl/new_chatroom_view.html'),
		util = require('common/utils')
		;
		

	// Extends Backbone.View
    var newChatroomView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( new_chatroom_tpl );
        },
        events:{
        	"click .back": "back"
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