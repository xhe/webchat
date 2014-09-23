define(function(require){
	
	var Backbone 		= require('backbone'),
		invitations_tpl		= require('text!tpl/invitations.html'),
		invitation_tpl	= require('text!tpl/invitation.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		InvitationModel = require('models/invitationModel')
		;
		

	// Extends Backbone.View
    var InvitationsView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( invitations_tpl );
        	 this.invitationCollection = new InvitationModel.InvitationCollection();
        },
        events:{
        	
        },
       
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Invitations").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new InvitationListView({el: $("#divInvitationList", this.el), model: this.invitationCollection});
            this.invitationCollection.getMyPendingInvitations();
            
            return this;
        }
    } );
    
    var InvitationListView =  Backbone.View.extend( {
    	
    	initialize:function () {
			this.model.bind("reset", this.render, this);
		},
		
		events: {
		},
		
		render: function(){
    		$(this.el).html(_.template( invitation_tpl, { 'invitations': this.model.result, 'serverUrl': (window.hostURL?window.hostURL:"") }));
		}
    	
    });
    
    return InvitationsView;
   
} );