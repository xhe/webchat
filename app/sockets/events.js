module.exports = function(io){

	io.on("connection", function(socket){
		
		console.log(socket.id +" connected ");
		
		socket.on('chat message', function(msg){
			    console.log('message: ' + msg);
			    io.sockets.emit('chat message', msg);
		 });
		
		socket.on('disconnect', function(){
			console.log(socket.id +" disconnected ");
			//io.sockets.emit('user disconnect');
		});
	});
	
}