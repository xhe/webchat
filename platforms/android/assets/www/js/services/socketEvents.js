
define(function (require) {
	
	var EventService = function( io ){
		
		this.EVENT_TYPE_INVITED = "invited";
		this.EVENT_TYPE_REPLIED = "replied";
		this.EVENT_TYPE_CHATMESSAGE = "chat_message";
		this.EVENT_NOTIFY_ON_LINE_MEMBER = "on_line_members";
		this.EVENT_NOTIFY_MEMBER_ON_LINE = "member_on_line";
		this.EVENT_NOTIFY_MEMBER_OFF_LINE = "member_off_line";
		this.EVENT_DISCONNECT = "disconnect-fffkkk";
		var socket = null;
		this.screenName = ""; 
		this.connect = function(screenName){
			this.screenName = screenName;
			socket = io.connect( (window.hostURL?window.hostURL:'')+'/', {
			    'reconnection delay': 100, // defaults to 500
			    'reconnection limit': 100, // defaults to Infinity
			    'max reconnection attempts': Infinity // defaults to 10
			  });
			bindSocketEvent();
			socket.emit("login", screenName);
		}; 
		
		this.logout = function(){  
			socket.emit("logout"); 
		}; 
		  
		this.isUserOnline = function(member){
			var result = _.find(this.onlineContacts, function(m){
				return m===member.screenName;
			});
			return result!=undefined;
		};
		
		this.onlineContacts = []; 
		 
		var bindSocketEvent = function(){
			socket.on(window.socketEventService.EVENT_DISCONNECT, function () {
				if(confirm("Please reload the page to establish connection with server. We apologize for the inconvenience.")){
					location.reload();
				}
			}); 
			  
			socket.on(window.socketEventService.EVENT_TYPE_INVITED, 
	          			function(invitation){
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_INVITED, invitation);
		   				}
					);
			
			socket.on(window.socketEventService.EVENT_TYPE_REPLIED, 
          			function(invitation){
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_REPLIED, invitation);
	   				}
				);
			
			socket.on(window.socketEventService.EVENT_TYPE_CHATMESSAGE, 
					function(msg){
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_CHATMESSAGE, msg);
					}
			);
			
			socket.on(window.socketEventService.EVENT_NOTIFY_ON_LINE_MEMBER, 
					function(users){
							window.socketEventService.onlineContacts = users;
					}
			);
			
			socket.on(window.socketEventService.EVENT_NOTIFY_MEMBER_ON_LINE, 
					function(screenName){
							window.socketEventService.onlineContacts.push(screenName );
							window.socketEventService.trigger(window.socketEventService.EVENT_NOTIFY_MEMBER_ON_LINE);
					}
			);
			socket.on(window.socketEventService.EVENT_NOTIFY_MEMBER_OFF_LINE, 
					function(screenName){
							for(var i=0;i<window.socketEventService.onlineContacts.length;i++){
								if(window.socketEventService.onlineContacts[i]===screenName){
									window.socketEventService.onlineContacts.splice(i, 1);
									break;
								}
							}
							window.socketEventService.trigger(window.socketEventService.EVENT_NOTIFY_MEMBER_OFF_LINE);
					}
			);
		}
		
	}
	
	return EventService;
});

