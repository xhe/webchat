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
        	 this.invitationCollection = new InvitationModel.InvitationCollection();
        },

        events: {
       	"click #btnFriendRequestAccept": "acceptInvitation",
       	"click #btnFriendRequestReject": "rejectInvitation",
       	},
        
       	acceptInvitation: function(){
       		console.log("accept")
       	},
       	rejectInvitation: function(){
       		console.log('rej')
       	},	
        
        setId: function(id){
        	this.id = id;
        	var _self= this;
        	 setTimeout( function(){
        		 _self.invitationCollection.getInvitationById(id);
        	 }, 1 );
        },
        
        render: function() { 
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Invitation").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            var detailView = new InvitationDetailDetailView({ model: this.invitationCollection});
             return this;
        }
    } );
    
    var InvitationDetailDetailView = Backbone.View.extend( {
    	 initialize: function() {
         	 this.model.on('reset', this.render);
         },
        
         
         
         render: function(){
        	 this.template = _.template( invitation_detail_detail_tpl );
        	 $("#divInvDetail").html( this.template({ invitation: this.result }) );
         
        	 $("#friendRequestReplyMsg").textinput().textinput("refresh");
    		 $( "#btnFriendRequestAccept" ).button().button( "refresh" );
    		 $( "#btnFriendRequestReject" ).button().button( "refresh" );
         	
         }
    });
    
    return InvitationView;
   
} );