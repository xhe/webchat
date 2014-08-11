define(function(require){
	
	var Backbone 		= require('backbone'),
		footer_tpl		= require('text!tpl/footer.html')
		util = require('common/utils')
		;
		
	var eventInitialized = false;
	
    var FooterView =  Backbone.View.extend( {
    	
    	 // The View Constructor
        initialize: function() {
        	if(window.socket && !eventInitialized){
        		window.socket.on('invited', 
	           			 function(invitation){
        			console.log(invitation);
        					invitation=JSON.parse(invitation);
		           		    $("#divNotification").html("Invitation from "+invitation.from.firstName+" "+invitation.from.lastName);
		           			$("#divNotification").addClass('notice');
			           	    $("#divNotification").fadeOut(10000, function(){
			           	    	$("#divNotification").removeClass('notice');
			           	    	$("#divNotification").html("Let's chat");
			           	    	$("#divNotification").fadeIn();
			           		});
        		});
        		eventInitialized = true;
        	}
        },
    	
    	render: function(){
    		$(this.el).html(_.template( footer_tpl));
		}
    });
      
   
    return FooterView;
   
} );