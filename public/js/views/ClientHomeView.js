define(function(require){
	
	var Backbone 		= require('backbone'),
		client_home_tpl		= require('text!tpl/client-home-page.html'),
		util = require('common/utils')
		;
		

	// Extends Backbone.View
    var clienthomeView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( client_home_tpl );
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            return this;
        }
    } );
      
   
    return clienthomeView;
   
} );