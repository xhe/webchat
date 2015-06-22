define(function(require){
	
	var Backbone 		= require('backbone'),
		dialing_tpl		= require('text!tpl/dialing.html'),
		appConfig = require('common/app-config'),
		CountryCollection = require('models/countryModel'),
		util = require('common/utils'),
		User = require('models/userModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		
	var eventInitialized = false;
	
	// Extends Backbone.View
    var DialingView = Backbone.View.extend( {

        // The View Constructor
        initialize: function(callee_id) {
        	
        	var _this = this;
        	if(!eventInitialized){
        		 window.socketEventService.on(window.socketEventService.EVENT_RTC_CALL_REQUEST_ACCEPT_CONFIRM,
      				 	function( roomName){
         			 		$.mobile.navigate("#videochat/"+roomName);
         			 	}
         		 );
        		 eventInitialized = true;	
        	}
        	
        	if(!window.myContacts){
        		$.mobile.navigate("#contacts");
        	}else{
        		this.callee_id = callee_id;
        		this.callee = _.find(window.myContacts, function(contact){
        			return contact._id===callee_id;
        		});
        		this.template = _.template( dialing_tpl );
        	}
        },
        
        events:{
        	"click .hrefVideo": "videoCall"
        },
        
        chatRoomName: null,
        
        videoCall: function(){
        	_self = this;
        	User.call(this.callee.screenName, 'video', function(result){
        		if(result.status=='success'){
        			_self.chatRoomName = result.roomName;
        			$(".hrefVideo").text("Dialing");
        		}else{
        			alert (result.err)
        		}
        	});
        	
        },
        
        render: function() {           
            $(this.el).html(this.template({ callee: this.callee, thumbNail: util.retrieveThumbNailPath(this.callee, 250) }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle( util.translate("Dialing")).render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            return this;
        }
    } );
   
    
    return DialingView;
   
} );