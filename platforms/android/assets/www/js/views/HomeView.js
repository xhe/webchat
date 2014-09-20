define(function(require){
	
	var Backbone 		= require('backbone'),
		home_tpl		= require('text!tpl/home-page.html'),
		home_totalInv_tpl		= require('text!tpl/totalInvitationBtn.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		InvitationModel = require('models/invitationModel')
		;
		

	// Extends Backbone.View
    var homeView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.invitationCollection = new InvitationModel.InvitationCollection();
        	 
        },
        
        render: function() {  
        	this.template = _.template( home_tpl );
       	 	$(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("My Home").disableBack().render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            
            var invTotalView = new invitationTotalView({el:$("#divTotalInvitations", this.el),  model: this.invitationCollection });
            var self = this;
            setTimeout(function(){
            	 self.invitationCollection.getMyPendingInvitations();
            }, 1);
           
            return this;
        }
    });
   
    var invitationTotalView = Backbone.View.extend({
    	
    	initialize: function(){
    		this.model.bind('reset', this.render);
    	},
    	render: function(){
    		this.template = _.template(home_totalInv_tpl);
    		if(this.result){
    			$("#divTotalInvitations").html(this.template({total: this.result.length}));
        	}else{
        		$(this.el).html( this.template({total: 0}) );
        	}
    	}
    });
    
    return homeView;
   
} );