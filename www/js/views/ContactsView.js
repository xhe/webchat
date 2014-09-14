define(function(require){
	
	var Backbone 		= require('backbone'),
		contacts_tpl	= require('text!tpl/contacts.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		ContactModel = require('models/contactModel'),
		util = require('common/utils')
		;
	var user_on_off_line_event_initialized = false;
	var contactCollection = null;
	var invRoomId = null;
	// Extends Backbone.View
    var ContactsView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( contacts_tpl );
        	 contactCollection = new ContactModel.ContactCollection();
        	 if(!user_on_off_line_event_initialized){
        		 _self = this;
        		 window.socketEventService.on(window.socketEventService.EVENT_NOTIFY_MEMBER_ON_LINE,
        				function(){
        			 		contactCollection.reset();
        		 		}
        		 );
        		 
        		 window.socketEventService.on(window.socketEventService.EVENT_NOTIFY_MEMBER_OFF_LINE,
     				 	function(){
        			 		contactCollection.reset();
     		 			}
        		 );
        		 
        		 user_on_off_line_event_initialized = true;
        	 }
        	 invRoomId = null;
        },
        
        setRoomId: function(roomId){
        	invRoomId = roomId;
        },
        
        render: function() { 
        		
        		$(this.el).html(this.template({ user: util.getLoggedInUser(), roomId: this.roomId }));
	            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Contacts").render();
	            new FooterView({ el: $(".footerContent", this.el)}).render();
	            
	            new ContactListView({el: $("#divContactsList", this.el), model: contactCollection});
	            return this;
        }
    } );
    
    
    var ContactListView = Backbone.View.extend( {
    	 initialize: function() {
         	 this.model.on('reset', this.render);
         	 var _this=this;
         	 setTimeout(function(){
         		_this.model.get_contacts();
         	 }, 1);
         },
         
         render: function(){
        	 
        	 $("#headerText").html("Contact (" + this.result.length +")");
        	 $("#ulContactsList").empty();
        	 _.each(this.result, function(member){
        		 var online = window.socketEventService.isUserOnline( member );
        		 var styleStr = "border:#cccccc 5px solid";
        		 if(online){
        			styleStr = "border:#008000 5px solid"
        		 }
        		 var link="detail";
        		 if( invRoomId ){
        			 link="invite_detail/"+member._id+"/"+invRoomId;
        		 }
        		 
        		 $("#ulContactsList").append($("<li>").html(
        				 		"<a href='#"+ link +"'>" +
        				 		"<img style='"+styleStr+"' src='" +  util.retrieveThumbNailPath(member, 100) +"'/>" 
        				 		+ member.firstName +" "+member.lastName
        				 		+"</a>"
        				 	)
        				 ); 
        	 });
        	 $("#ulContactsList").listview().listview('refresh');
 		}
         
    });
    
    
    
    return ContactsView;
   
} );