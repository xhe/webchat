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
				
				console.log("now having " + JSON.stringify(sockets_username_socket))
				
			});
			
			socket.on(EVENT_LOGOUT, function(){
				
				delete sockets_username_socket[sockets_socketid_username[socket.id]];
				delete allSockets[socket.id];
				
				console.log("after logout now having " + Object.keys(sockets_username_socket).length);
			});
			
			socket.on('chat message', function(msg){
				    io.sockets.emit('chat message', msg);
			 });
			
			socket.on(EVENT_DISCONNECT, function(){
				delete sockets_username_socket[sockets_socketid_username[socket.id]];
				delete allSockets[socket.id];
				
				console.log("now having " + Object.keys(sockets_username_socket).length);
				//io.sockets.emit('user disconnect');
			});
		});
	};
	
	
  var sendInvitation = function(invitation){
	  console.log(invitation.from.screenName +" invites " + invitation.to.screenName);
	  console.log('socket id' +  sockets_username_socket[invitation.to.screenName] );
	  console.log(JSON.stringify( sockets_username_socket) );
	  console.log(allSockets[ sockets_username_socket[invitation.to.screenName] ]);
	  
	  getSocketFromUserName(invitation.to.screenName).emit(EVENT_NOTIFY_INVITATION, JSON.stringify(invitation));
  };	
  
  
  var getSocketFromUserName = function(userName){
	   return allSockets[sockets_username_socket[userName]];
  };
  
  return {
	  init: initSocket,
	  sendInvitation: sendInvitation
  }
	
}