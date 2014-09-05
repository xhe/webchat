var express = require('express'),
cluster = require('cluster'),
net = require('net'),
sio = require('socket.io'),
sio_redis = require('socket.io-redis'),
init = require('./config/init')(),
config = require('./config/config'),
fs = require('fs')
;

var port = config.port,
	num_processes =  process.env.WORKERS || require('os').cpus().length;

if (cluster.isMaster) {

  var workers = [];
  //Helper function for spawning worker at index 'i'.
  var spawn = function(i) {
      workers[i] = cluster.fork();
      // Optional: Restart worker on exit
      workers[i].on('exit', function(worker, code, signal) {
    	  logError("espawning worker "+ i );
          console.log('respawning worker', i);
          spawn(i);
      });
  };
  // Spawn workers.
  for (var i = 0; i < num_processes; i++) {
      spawn(i);
  }

  var worker_index = function(ip, len) {
      var s = '';
      for (var i = 0, _len = ip.length; i < _len; i++) {
          if (ip[i] !== '.') {
              s += ip[i];
          }
      }
      return Number(s) % len;
  };

  // Create the outside facing server listening on our port.
  var server = net.createServer(function(connection) {
  	  var worker = workers[worker_index(connection.remoteAddress, num_processes)];
  	  worker.send('sticky-session:connection', connection);
  }).listen(port);
  
} else {
	
	var mongoose = require('mongoose');
	
	//Bootstrap db connection
	var db = mongoose.connect(config.db);
	//Init the express application
	var app = require('./config/express')(db);
	//Start the app by listening on <port>
	var server = app.listen(0, 'localhost');
	
	var io = sio(server);
	io.adapter(sio_redis({ host: config.redis.host, port: config.redis.port }));
	
	var socketService = require('./app/services/sockets');
	socketService()['init'](io);
	
	// Listen to messages sent from the master. Ignore everything else.
    process.on('message', function(message, connection) {
    	 if (message !== 'sticky-session:connection') {
            return;
        }

        server.emit('connection', connection);
    });
	
    //Logging initialization
	console.log('MEAN.JS application started on port ' + config.port);
}

process.on('uncaughtException', function (err) {
	console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
	console.error(err.stack)
	logError("died");
	process.exit(1)
})

var logError=function(string){
	 fs.open('error_log','a', function(err, fd){
		 if(err){
			 console.log(err);
		 }else{
			 var buffer = new Buffer( new Date().toUTCString() +":" + string +'\n'
					  );
					  fs.write(fd, buffer, 0, buffer.length, null, function(err) {
						 fs.close(fd); 
					  });
		 }
		  
	  });
}
	 