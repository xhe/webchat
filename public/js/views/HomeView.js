define(function(require){
	
	var Backbone 		= require('backbone'),
		home_tpl		= require('text!tpl/home-page.html'),
		util = require('common/utils')
		;
		

	// Extends Backbone.View
    var homeView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( home_tpl );
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            return this;
        }
    } );
      
   
    return homeView;
   
} );