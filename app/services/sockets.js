var sockets_username_socket = {};
var sockets_socketid_username = {};
var allSockets = {};

var EVENT_LOGIN = "login";
var EVENT_LOGOUT = "logout";
var EVENT_DISCONNECT = "disconnect";
var EVENT_NOTIFY_INVITATION="invited";
var EVENT_NOTIFY_INVITATION_REPLY="replied";
var EVENT_NOTIFY_CHAT_MESSAGE="chat_message";

module.exports =  function(){
	
	var initSocket = function(io){
		
		io.on("connection", function(socket){
			socket.on(EVENT_LOGIN, function(name){
		
				sockets_username_socket[name] = socket.id;
				sockets_socketid_username[socket.id] = name;
				allSockets[socket.id] = socket;
				
			});
			
			socket.on(EVENT_LOGOUT, function(){
				
				delete sockets_username_socket[sockets_socketid_username[socket.id]];
				delete allSockets[socket.id];
			
			});
			
			socket.on('chat message', function(msg){
				    io.sockets.emit('chat message', msg);
			 });
			
			socket.on(EVENT_DISCONNECT, function(){
				delete sockets_username_socket[sockets_socketid_username[socket.id]];
				delete allSockets[socket.id];
			});
		});
	};
	
	
  var sendInvitation = function(invitation){
	  var socket = getSocketFromUserName(invitation.to.screenName);
	  if (socket){
		  console.log("socket: sending " + EVENT_NOTIFY_INVITATION)
		   socket.emit(EVENT_NOTIFY_INVITATION, JSON.stringify(invitation));
	  }
		 
  };	
  
  var replyInvitation = function(invitation){
	  var socket = getSocketFromUserName(invitation.from.screenName);
	  if (socket){
		  console.log("socket: sending " + EVENT_NOTIFY_INVITATION_REPLY)
		  socket.emit(EVENT_NOTIFY_INVITATION_REPLY, JSON.stringify(invitation));
	  } 
  };
  
  var sentChatMessage = function(message, member){
	  var socket = getSocketFromUserName(member.screenName);
	  if(socket){
		  console.log("socket: sending msg " + EVENT_NOTIFY_CHAT_MESSAGE)
		  socket.emit(EVENT_NOTIFY_CHAT_MESSAGE, JSON.stringify(message));
	  }
  };
  
  
  var getSocketFromUserName = function(userName){
	   return allSockets[sockets_username_socket[userName]];
  };
  
  return {
	  init: initSocket,
	  sendInvitation: sendInvitation,
	  replyInvitation: replyInvitation,
	  sentChatMessage: sentChatMessage
  }
	
}