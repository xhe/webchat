var express = require('express'),
cluster = require('cluster'),
net = require('net'),
sio = require('socket.io'),
sio_redis = require('socket.io-redis'),
init = require('./config/init')(),
config = require('./config/config'),
fs = require('fs')
;

var port = config.port;
var	num_processes =  1;

if (process.env.NODE_ENV=='production'){
	num_processes = process.env.WORKERS || require('os').cpus().length;
}

var autoRestartedTimes = 0;
var worker_start_ts = [];
var worker_start_cnt = [];

if (cluster.isMaster) { 
  
  var workers = [];
  //Helper function for spawning worker at index 'i'.
  var spawn = function(i) {
      workers[i] = cluster.fork();
      worker_start_ts[i] = new Date().getTime();
      worker_start_cnt[i]++;
      // Optional: Restart worker on exit
      workers[i].on('exit', function(worker, code, signal) {
    	  logError("espawning worker "+ i , function(){
    		  console.log('respawning worker', i);
    		  var nowTs = new Date().getTime();
    		  if( (nowTs-worker_start_ts[i])<1000 ){
    			  worker_start_ts[i] = nowTs;
    			  worker_start_cnt[i]++;
    		  }
    		  
    		  if( worker_start_cnt[i]<10){
    			  spawn(i);
    		  }else{
    			  logError("Permanently Failed, too many restarting", function(){
    				  console.log("permanently failed ");
    			  });
    		  }
    		  
    	  } );
      });
  };
  // Spawn workers.
  for (var i = 0; i < num_processes; i++) {
	  worker_start_cnt[i] = 0;
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
  if(num_processes>1)
	  var server = net.createServer(function(connection) {
	  	  var worker = workers[worker_index(connection.remoteAddress, num_processes)];
	  	  worker.send('sticky-session:connection', connection);
	  }).listen(port);
  
} else {
	
	var mongoose = require('mongoose');
	
	//Bootstrap db connection
	var db = mongoose.connect(config.db, {server:{auto_reconnect:true}});
	//Init the express application
	var app = require('./config/express')(db);
	//Start the app by listening on <port>
	if(num_processes>1)
		var localServer = app.listen(0, 'localhost');
	else
		var localServer = app.listen(port);
	
	var io = sio(localServer);
	if(num_processes>1)
		io.adapter(sio_redis({ host: config.redis.host, port: config.redis.port }));
	
	var socketService = require('./app/services/sockets');
	socketService()['init'](io);
	
	// Listen to messages sent from the master. Ignore everything else.
	if(num_processes>1){
		process.on('message', function(message, connection) {
	    	 if (message !== 'sticky-session:connection') {
	            return;
	        }
	    	localServer.emit('connection', connection);
		});
	}
  
    //Logging initialization
	console.log('MEAN.JS application started on port ' + config.port);
}

process.on('uncaughtException', function (err) {
	logError( err.message+'\n'+ err.stack, function(){
		process.exit(1);
	});
})


var logError=function(string, cb){
	 fs.open('error_log','a', function(err, fd){
		 if(err){
			 console.log(err);
		 }else{
			 var buffer = new Buffer( new Date().toUTCString() +":" + string +'\n'
					  );
					  fs.write(fd, buffer, 0, buffer.length, null, function(err) {
						 fs.close(fd); 
						 cb();
					  });
		 }
	  });
}
	 