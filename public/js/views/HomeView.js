define(function(require){
	
	var Backbone 		= require('backbone'),
		home_tpl		= require('text!tpl/home-page.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		
		;
		

	// Extends Backbone.View
    var homeView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( home_tpl );
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("My Home").disableBack().render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            return this;
        }
    });
   
    return homeView;
   
} );