define(function(require){
	
	var Backbone 		= require('backbone'),
		footer_tpl		= require('text!tpl/footer.html')
		util = require('common/utils')
		;
		
	var eventInitialized = false;
	var currentRoomId = null;
	
    var FooterView =  Backbone.View.extend( {
    	
    	 // The View Constructor
        initialize: function() {
        	var _this = this;
        	if(!eventInitialized){
        		
        		window.socketEventService.on( window.socketEventService.EVENT_TYPE_INVITED, 
        				function(invitation){
        					_this.notify('hrefFooterInvitation');
        				}
        		);
        		
        		window.socketEventService.on( window.socketEventService.EVENT_TYPE_REPLIED, 
        				function(invitation){
        					_this.notify('hrefFooterInvitation');
        				}
        		);
        		
        		window.socketEventService.on( window.socketEventService.EVENT_TYPE_CHATMESSAGE, 
        				function(msg){  	
        			 		var chat = JSON.parse(msg);
        			 		if( chat.room !== currentRoomId){
        			 			if( chat.creator._id !== util.getLoggedInUser()._id ){
        			 				_this.notify('hrefFooterChatroom');
        			 			}
        			 		}	
        				}
        		);
        		
        		 window.socketEventService.on(window.socketEventService.EVENT_NOTIFY_MEMBER_ON_LINE,
         				function(){
        			 		_this.notify('hrefFooterContact');
         		 		}
         		 );
         		 
         		 window.socketEventService.on(window.socketEventService.EVENT_NOTIFY_MEMBER_OFF_LINE,
      				 	function(){
         			 		_this.notify('hrefFooterContact', true);
      		 			}
         		 );
        		
        		
        		eventInitialized = true;
        	}
        	currentRoomId = null;
        	return this;
        },
    	
        setRoomId: function(id){ 
        	currentRoomId = id;
        },
        
        notify: function(type, remove){
        	
        	if(remove){
        		$("#"+type).removeClass('spanFooterReminder');
            }else{
        		$("#"+type).addClass('spanFooterReminder');
        	}
        },
        
        notice: function(invitation, msg, link){
        	invitation=JSON.parse(invitation);
        	if(link){
        		$("#divNotification").html('<a href="'+link+'">'+ msg + invitation.from.firstName+" "+invitation.from.lastName +'</a>');
       				
        	}else{
        		$("#divNotification").html(msg + invitation.from.firstName+" "+invitation.from.lastName);
   			}
        	showEffect();
        },
        
        showEffect: function(){
        	$("#divNotification").addClass('notice');
       	    $("#divNotification").fadeOut(10000, function(){
       	    	$("#divNotification").removeClass('notice');
       	    	$("#divNotification").html("Let's chat");
       	    	$("#divNotification").fadeIn();
       		});
        },
        
    	render: function(){
    		$(this.el).html(_.template( footer_tpl));
    		return this;
		}
    });
      
   
    return FooterView;
   
} );