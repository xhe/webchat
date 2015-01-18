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
        	 if(this.result.length==0){
        		 $("#h1NoContact").show();
        	 }else{
        		 $("#h1NoContact").hide();
        	 }
        	 
        	 $("#ulContactsList").empty();
        	 _.each(this.result, function(member){
        		 var online = window.socketEventService.isUserOnline( member );
        		 var styleStr = "border:#cccccc 5px solid";
        		 if(online){
        			styleStr = "border:#008000 5px solid"
        		 }
        		 var link="highlights/"+member.screenName;
        		 var title = "Detail"
        		 if( invRoomId ){
        			 link="invite_detail/"+member._id+"/"+invRoomId;
        			 title = "Invite"
        		 }
        		 
        		 //Don't show call button if not supported
        		 
        		 var checkStr = member.is_family?"checked='checked'":"";
        		 
        		 var thumbNailUrl = util.retrieveThumbNailPath(member, 50);
        		 if( !window.platform && ( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ) ){ 
        			 var callLink = "#dialing/"+member._id; 
        			 
            		 $("#ulContactsList").append($("<li style='padding-left: 5px; padding-right: 5px'>").html(
            				 		"<table width='100%'><tr><td align='center'>"
            				 		+
            				 		(thumbNailUrl==""? "<span class='noHeadImg'></span>" :  ("<img style='"+styleStr+"' src='" +  thumbNailUrl  +"'/>") )
            				 		+
            				 		"<br/>"+member.firstName+" "+ member.lastName +
            				 		"</td><td ><a href='"+callLink+"' data-role='button' class='hrefCall' data-inline='true' ></a></td>"+
            				 		"<td><a href='#"+link+"' data-role='button' class='hrefDetail' data-inline='true' >"+title+"</a></td><td><input onchange='updateRelationship(event)' type='checkbox' "+checkStr+" id='chkbox-"+member.screenName+"' class='custom chkContactName' data-mini='true' data-username='"+member.screenName+"'/><label for='chkbox-"+member.screenName+"'>Family</label></td></tr></table>"
            				 	)
            				 );
        		 }else{
        			 
        			$("#ulContactsList").append($("<li style='padding-left: 5px; padding-right: 5px'>").html(
     				 		"<table width='100%'><tr><td  align='center'>"
        					+
    				 		(thumbNailUrl==""? "<span class='noHeadImg'></span>" :  ("<img style='"+styleStr+"' src='" +  thumbNailUrl  +"'/>") )
    				 		+
     				 		"</td><td><strong>"+ member.firstName+" "+ member.lastName +"</strong></td>"+
     				 		"<td><a href='#"+link+"' data-role='button' class='hrefDetail' data-inline='true' >"+title+"</a></td><td><input onchange='updateRelationship(event)' type='checkbox' "+checkStr+" id='chkbox-"+member.screenName+"' class='custom chkContactName' data-mini='true' data-username='"+member.screenName+"'/><label for='chkbox-"+member.screenName+"'>Family</label></td></tr></table>"
           				 
     				 	)
     				 ); 
        		 }
        	 });
        	 $("#ulContactsList").listview().listview().listview('refresh');
        	 $(".hrefCall").button();
        	 $(".hrefDetail").button();
        	 $( "input[type=checkbox]" ).checkboxradio().checkboxradio( "refresh" );
 		}
    });
    return ContactsView;
   
});

function updateRelationship(event){
	$.ajax({
		  url: ( window.hostURL?window.hostURL:'/') +  'api/relationship',
		  type: 'PUT',
		  data: "u="+event.target.getAttribute("data-username")+"&is_family="+$(event.target).is(":checked"),
		  success: function(data) {
		    //alert('Load was performed.');
		  }
		});
	
}
