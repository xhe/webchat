define(function(require){
	
	var Backbone 		= require('backbone'),
		footer_tpl		= require('text!tpl/footer.html')
		util = require('common/utils')
		;
		
	var eventInitialized = false;
	
    var FooterView =  Backbone.View.extend( {
    	
    	 // The View Constructor
        initialize: function() {
        	var _this = this;
        	if(window.socket && !eventInitialized){
        		window.socket.on('invited', 
	           			 function(invitation){
        					_this.notice(invitation, "Invited from ", "#invitations");
        				}
        		);
        		window.socket.on('replied', 
	           			 function(invitation){
        					var msg = null; 
        					if (JSON.parse(invitation).status==1){
        						 msg = 'Invitation accepted by ';
        					}else{
        						msg = 'Invitation refused by ';
        					}
        					
        					_this.notice(invitation, msg, "#chatrooms");
        				}
        		);
        		eventInitialized = true;
        	}
        },
    	
        notice: function(invitation, msg, link){
        	invitation=JSON.parse(invitation);
        	if(link){
        		$("#divNotification").html('<a href="'+link+'">'+ msg + invitation.from.firstName+" "+invitation.from.lastName +'</a>');
       				
        	}else{
        		$("#divNotification").html(msg + invitation.from.firstName+" "+invitation.from.lastName);
   			}
        	
   		    $("#divNotification").addClass('notice');
       	    $("#divNotification").fadeOut(10000, function(){
       	    	$("#divNotification").removeClass('notice');
       	    	$("#divNotification").html("Let's chat");
       	    	$("#divNotification").fadeIn();
       		});
        },
        
    	render: function(){
    		$(this.el).html(_.template( footer_tpl));
		}
    });
      
   
    return FooterView;
   
} );