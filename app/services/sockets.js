var sockets_username_socket = {};
var sockets_socketid_username = {};
var allSockets = {};

var EVENT_LOGIN = "login";
var EVENT_LOGOUT = "logout";
var EVENT_DISCONNECT = "disconnect";
var EVENT_NOTIFY_INVITATION="invited";
var EVENT_NOTIFY_INVITATION_REPLY="replied";
var EVENT_NOTIFY_CHAT_MESSAGE="chat_message";
var EVENT_NOTIFY_MEMBER_ON_LINE="member_on_line";
var EVENT_NOTIFY_MEMBER_OFF_LINE="member_off_line";
var EVENT_NOTIFY_ON_LINE_MEMBER="on_line_members";

var user_service =  require('../services/user'),
	_ = require("lodash");

module.exports =  function(){
	
	var initSocket = function(io){
		
		io.on("connection", function(socket){ 
			console.log('connection');
			socket.on(EVENT_LOGIN, function(name){
				sockets_username_socket[name] = socket.id;
				sockets_socketid_username[socket.id] = name;
				allSockets[socket.id] = socket;
				sendUserOnLineMsg(name);
			});
			
			socket.on(EVENT_LOGOUT, function(){
				sendUserOffLineMsg(socket.id);
				
				delete sockets_username_socket[sockets_socketid_username[socket.id]];
				delete allSockets[socket.id];
				
			
			});
			
			socket.on('chat message', function(msg){
				    io.sockets.emit('chat message', msg);
			 });
			
			socket.on(EVENT_DISCONNECT, function(){
				sendUserOffLineMsg(socket.id);
				delete sockets_username_socket[sockets_socketid_username[socket.id]];
				delete allSockets[socket.id];
			});
		});
	};
	
	
  var sendInvitation = function(invitation){
	  var socket = getSocketFromUserName(invitation.to.screenName);
	  if (socket){
		  //console.log("socket: sending " + EVENT_NOTIFY_INVITATION +" to " + invitation.from.screenName)
		   socket.emit(EVENT_NOTIFY_INVITATION, JSON.stringify(invitation));
	  }
		 
  };	
  
  var replyInvitation = function(invitation){
	  var socket = getSocketFromUserName(invitation.from.screenName);
	  if (socket){
		 // console.log("socket: sending " + EVENT_NOTIFY_INVITATION_REPLY +" to " + invitation.from.screenName)
		  socket.emit(EVENT_NOTIFY_INVITATION_REPLY, JSON.stringify(invitation));
	  } 
  };
  
  var sentChatMessage = function(message, member){
	  var socket = getSocketFromUserName(member.screenName);
	  if(socket){
		 // console.log("socket: sending msg " + EVENT_NOTIFY_CHAT_MESSAGE)
		  socket.emit(EVENT_NOTIFY_CHAT_MESSAGE, JSON.stringify(message));
	  }
  };
  
  var sendUserOnLineMsg = function(name){
	  user_service.get_contacts(name, function(users){
		   var socket = null;
		   var onlineContacts = [];
		   _.forEach( users, function(user){
			   socket = getSocketFromUserName(user.screenName);
			   if(socket){
				   socket.emit(EVENT_NOTIFY_MEMBER_ON_LINE, name);
				   onlineContacts.push(user.screenName);
			   }   
			  // console.log(" sending on to " + user.screenName +" for " + name)
		   });
		   
		   socket = getSocketFromUserName(name);
		   if(socket)
			   socket.emit(EVENT_NOTIFY_ON_LINE_MEMBER, onlineContacts);
	  });
	  
	  
	  
  };
  
  var sendUserOffLineMsg = function(socketId){ 
	  name = sockets_socketid_username[socketId];
	  user_service.get_contacts(name, function(users){
		   _.forEach( users, function(user){
			   var socket = getSocketFromUserName(user.screenName);
			   if(socket)
				   socket.emit(EVENT_NOTIFY_MEMBER_OFF_LINE, name);
			  // console.log(" sending offlien to " + user.screenName +" for " + name)
		   });
	  });
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