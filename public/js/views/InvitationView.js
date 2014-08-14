define(function(require){
	
	var Backbone 		= require('backbone'),
		invitation_detail_tpl	= require('text!tpl/invitation_detail.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		InvitationModel = require('models/invitationModel')
		;
		

	// Extends Backbone.View
    var InvitationView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( invitation_detail_tpl );
        	 this.invitation = new InvitationModel.Invitation();
        	 this.invitation.on('reset', this.update);
        },
        
        setId: function(id){
        	this.invitation.getInvitationById(id);
        },
        
        events:{
        	
        },
        
        update: function(){
        	console.log("updated");
        },
       
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Invitation").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            //this.invitationCollection.getMyPendingInvitations();
            
            return this;
        }
    } );
    
    return InvitationView;
   
} );