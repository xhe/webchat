define(function(require){
	
	var Backbone 		= require('backbone'),
		home_tpl		= require('text!tpl/home-page.html'),
		home_totalInv_tpl = require('text!tpl/totalInvitationBtn.html'),
		homt_totalMsg_tpl =	require( 'text!tpl/totalNewMessagesBtn.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		InvitationModel = require('models/invitationModel')
		;
		
	var home_view_event_initialized = false;
	// Extends Backbone.View
    var homeView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.invitationCollection = new InvitationModel.InvitationCollection();
        	 var _self = this;
        	 if(!home_view_event_initialized){
        		 window.socketEventService.on(window.socketEventService.EVENT_TYPE_RESUME_HOME, function(){
        			 _self.invitationCollection.getMyGeneralInfo();
        		 });
        		 home_view_event_initialized = true;
        	 }
        },
        
        events: {
        	"click #btnRefresh": "refresh"
        },
        
        refresh: function(){
        	location.reload(); 
        },
        
        render: function() {  
        	this.template = _.template( home_tpl );
       	 	$(this.el).html(this.template({  user: util.getLoggedInUser(), serverUrl: (window.hostURL?window.hostURL:"")  }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("My Home").setHomeheader().disableBack().render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            
            var invTotalView = new invitationTotalView({el:$("#divTotalInvitations", this.el),  model: this.invitationCollection });
            var self = this;
            setTimeout(function(){
            	 self.invitationCollection.getMyGeneralInfo();
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
    		this.template_msg = _.template( homt_totalMsg_tpl );
    		if(this.result){
    			$("#divTotalInvitations").html(this.template({total: this.result.payload.pending_invitations.length}));
    			$("#divTotalNewMsgs").html(this.template_msg({total: this.result.payload.total_new_msg}))
        	}else{
        		$(this.el).html( this.template({total: 0}) );
        	}
    	}
    });
    
    return homeView;
   
} );