var sockets_username_socket = {};
var sockets_socketid_username = {};
var allSockets = {};

var EVENT_LOGIN = "login";
var EVENT_LOGOUT = "logout";
var EVENT_DISCONNECT = "disconnect";
var EVENT_NOTIFY_INVITATION="invited";
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
	
				//io.sockets.emit('user disconnect');
			});
		});
	};
	
	
  var sendInvitation = function(invitation){
	  var socket = getSocketFromUserName(invitation.to.screenName);
	  if (socket)
		  socket.emit(EVENT_NOTIFY_INVITATION, JSON.stringify(invitation));
  };	
  
  
  var getSocketFromUserName = function(userName){
	   return allSockets[sockets_username_socket[userName]];
  };
  
  return {
	  init: initSocket,
	  sendInvitation: sendInvitation
  }
	
}