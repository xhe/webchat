define(function(require){
	
	var Backbone 		= require('backbone'),
		invitation_detail_tpl	= require('text!tpl/invitation_detail.html'),
		invitation_detail_detail_tpl	= require('text!tpl/invitation_detail_detail.html'),
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
        },
        
        setId: function(id){
        	this.id = id;
        },
        
        render: function() { 
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Invitation").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            var detailView = new InvitationDetailDetailView({ model: this.invitation});
            detailView.setId(this.id);
            return this;
        }
    } );
    
    var InvitationDetailDetailView = Backbone.View.extend( {
    	 initialize: function() {
         	 this.model.on('reset', this.render);
         },
         
         setId: function(id){
        	 var _self = this;
        	 setTimeout( function(){
        		 _self.model.getInvitationById(id);
        	 }, 1 );
         },
         
         render: function(){
        	 this.template = _.template( invitation_detail_detail_tpl );
        	 $("#divInvDetail").html( "this is an error content" );
        	 
         }
    });
    
    return InvitationView;
   
} );