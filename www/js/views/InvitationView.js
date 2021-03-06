define(function(require){
	
	var Backbone 		= require('backbone'),
		invitation_detail_tpl	= require('text!tpl/invitation_detail.html'),
		invitation_detail_detail_tpl	= require('text!tpl/invitation_detail_detail.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		InvitationModel = require('models/invitationModel'),
		util = require('common/utils')
		;
		

	// Extends Backbone.View
    var InvitationView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( invitation_detail_tpl );
        	 this.invitationCollection = new InvitationModel.InvitationCollection();
        	 this.invitationCollection.on('action_done', this.action_done);
        },

        events: {
	       	"click #btnFriendRequestAccept": "acceptInvitation",
	       	"click #btnFriendRequestReject": "rejectInvitation",
       	},
        
       	action_done: function(){
       		util.alert('Action has been submitted successfully.');
       		$.mobile.navigate("#");
       	},
       	
       	acceptInvitation: function(){
       		this.invitationCollection.handleInvitation(this.id, 'accept', $("#friendRequestReplyMsg").val(), $("#radRelationship-reply-family").is(':checked') );
       	},
       	
       	rejectInvitation: function(){
       		this.invitationCollection.handleInvitation(this.id, 'refuse', $("#friendRequestReplyMsg").val(), $("#radRelationship-reply-family").is(':checked') );
       	},	
        
        setId: function(id){
        	this.id = id;
        	var _self= this;
        	 setTimeout( function(){
        		 _self.invitationCollection.getInvitationById(id);
        	 }, 1 );
        },
        
        render: function() { 
            $(this.el).html(this.template({ user: util.getLoggedInUser(), 'serverUrl': (window.hostURL?window.hostURL:"")  }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(util.translate("Invitation")).render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            var detailView = new InvitationDetailDetailView({ model: this.invitationCollection});
             return this;
        }
    } );
    
    var InvitationDetailDetailView = Backbone.View.extend({
    	
    	 initialize: function() {
         	 this.model.on('reset', this.render);
         },
         
         render: function(){
        	 this.template = _.template( invitation_detail_detail_tpl );
        	 $("#divInvDetail").html( this.template({ invitation: this.result ,  'serverUrl': (window.hostURL?window.hostURL:"") }) );
         	 $("#friendRequestReplyMsg").textinput().textinput("refresh");
    		 $( "#btnFriendRequestAccept" ).button().button( "refresh" );
    		 $( "#btnFriendRequestReject" ).button().button( "refresh" );
    		 $("#radRelationship-reply-family").checkboxradio().checkboxradio( "refresh" );
			 $("#radRelationship-reply-friend").checkboxradio().checkboxradio( "refresh" );
         }
    });
    
    return InvitationView;
   
} );