
define(function (require) {
	
	var EventService = function( io ){
		
		util = require('common/utils');
		
		
		this.EVENT_TYPE_INVITED = "invited";
		this.EVENT_TYPE_REPLIED = "replied";
		this.EVENT_TYPE_CHATMESSAGE = "chat_message";
		this.EVENT_NOTIFY_ON_LINE_MEMBER = "on_line_members";
		this.EVENT_NOTIFY_MEMBER_ON_LINE = "member_on_line";
		this.EVENT_NOTIFY_MEMBER_OFF_LINE = "member_off_line";
		this.EVENT_DISCONNECT = "disconnect";
		
		this.EVENT_TYPE_INVITED_FOOTER = "invited_FOOTER";
		this.EVENT_TYPE_REPLIED_FOOTER = "replied_FOOTER";
		this.EVENT_TYPE_CHATMESSAGE_FOOTER = "chat_message_FOOTER";
		this.EVENT_NOTIFY_ON_LINE_MEMBER_FOOTER = "on_line_members_FOOTER";
		this.EVENT_NOTIFY_MEMBER_ON_LINE_FOOTER = "member_on_line_FOOTER";
		this.EVENT_NOTIFY_MEMBER_OFF_LINE_FOOTER = "member_off_line_FOOTER";
		this.EVENT_NOTIFY_MEMBER_OFF_LINE_FOOTER = "member_off_line_FOOTER";
		this.EVENT_RTC_CALL_REQUEST="rtc_call_request";
		this.EVENT_RTC_CALL_REQUEST_ACCEPT="rtc_call_request_accept";
		this.EVENT_RTC_CALL_REQUEST_ACCEPT_CONFIRM="rtc_call_request_accept_confirm";
		this.EVENT_UPDATE_ROOMS_INFO = "update_rooms_info";
		this.EVENT_RESUME_UPDATE_CHATROOMS = "EVENT_RESUME_UPDATE_CHATROOMS";
		this.EVENT_TYPE_RESUME_ROOMS="EVENT_TYPE_RESUME_ROOMS";
		this.EVENT_TYPE_RESUME_ROOM="EVENT_TYPE_RESUME_ROOM";
		this.EVENT_TYPE_RESUME_HOME="EVENT_TYPE_RESUME_HOME";
		
		var socket = null;
		this.screenName = ""; 
		this.connect = function(screenName){
			this.screenName = screenName;
			if(!socket){
				socket = io(window.hostURL?window.hostURL:'/' );
				bindSocketEvent();
				socket.emit("login", screenName);
			}
		}; 
		
		this.logout = function(){  
			if(socket){
				socket.emit("logout"); 
				unbindSocketEvents();
				socket = null;
			}
		}; 
		
		this.answer_phone_call = function(screenName, room){
			if(socket)
			socket.emit(this.EVENT_RTC_CALL_REQUEST_ACCEPT, screenName, room);
		};
		
		this.isUserOnline = function(member){
			var result = _.find(this.onlineContacts, function(m){
				return m===member.screenName;
			});
			return result!=undefined;
		};
		
		this.onlineContacts = []; 
		
		var unbindSocketEvents = function(){
			if(socket){
				socket.removeAllListeners( window.socketEventService.EVENT_DISCONNECT );
				socket.removeAllListeners( window.socketEventService.EVENT_TYPE_INVITED );
				socket.removeAllListeners( window.socketEventService.EVENT_TYPE_REPLIED );
				socket.removeAllListeners( window.socketEventService.EVENT_TYPE_CHATMESSAGE );
				socket.removeAllListeners( window.socketEventService.EVENT_NOTIFY_ON_LINE_MEMBER );
				socket.removeAllListeners( window.socketEventService.EVENT_NOTIFY_MEMBER_ON_LINE );
				socket.removeAllListeners( window.socketEventService.EVENT_NOTIFY_MEMBER_OFF_LINE );
				socket.removeAllListeners( window.socketEventService.EVENT_RTC_CALL_REQUEST );
				socket.removeAllListeners( window.socketEventService.EVENT_RTC_CALL_REQUEST_ACCEPT );
				socket.removeAllListeners( window.socketEventService.EVENT_RTC_CALL_REQUEST_ACCEPT_CONFIRM );
			}
			
		};
		
		var bindSocketEvent = function(){
			
			if(!socket)
				return;
			
			socket.on(window.socketEventService.EVENT_DISCONNECT, function () {
				//if(confirm("Please reload the page to establish connection with server. We apologize for the inconvenience.")){
				//	location.reload();
				//}
				window.socketEventService.logout();
			}); 
			  
			socket.on(window.socketEventService.EVENT_TYPE_INVITED, 
	          			function(invitation){
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_INVITED, invitation);
							util.vibrate();
		   				}
					);
			
			socket.on(window.socketEventService.EVENT_TYPE_REPLIED, 
          			function(invitation){
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_REPLIED, invitation);
							util.vibrate();
	   				}
				);
			
			socket.on(window.socketEventService.EVENT_TYPE_CHATMESSAGE, 
					function(msg){
				
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_CHATMESSAGE, msg);
							window.socketEventService.trigger(window.socketEventService.EVENT_TYPE_RESUME_HOME);
							if(JSON.parse(msg).creator.screenName!==util.getLoggedInUser().screenName){
								util.vibrate();
							};
							
							window.socketEventService.trigger(  window.socketEventService.EVENT_UPDATE_ROOMS_INFO );
        			 			
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
			socket.on(window.socketEventService.EVENT_RTC_CALL_REQUEST, 
					function(caller_screenName, caller_fullName, roomName){
							window.socketEventService.trigger(window.socketEventService.EVENT_RTC_CALL_REQUEST, caller_screenName, caller_fullName, roomName);
					}
			);
			socket.on(window.socketEventService.EVENT_RTC_CALL_REQUEST_ACCEPT_CONFIRM, 
					function(roomName){
							window.socketEventService.trigger(window.socketEventService.EVENT_RTC_CALL_REQUEST_ACCEPT_CONFIRM, roomName);
					}
			);
		}
		
	}
	
	return EventService;
});

