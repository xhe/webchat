/*
 * var init = require('./config/init')(),
config = require('./config/config'),
mongoose = require('mongoose');

//Bootstrap db connection
var db = mongoose.connect(config.db);
//Init the express application
var app = require('./config/express')(db);


//Start the app by listening on <port>
var server = app.listen(config.port);

var io = require('socket.io')(server);
var socketService = require('./app/services/sockets');
socketService()['init'](io);


//Logging initialization
console.log('MEAN.JS application started on port ' + config.port);
*/
var cluster = require('cluster'),
net = require('net');

var num_processes =  process.env.WORKERS || require('os').cpus().length;

if (cluster.isMaster) {

  console.log('start cluster with %s workers', num_processes);

  
  
//This stores our workers. We need to keep them to be able to reference
  // them based on source IP address. It's also useful for auto-restart,
  // for example.
  var workers = [];
//Helper function for spawning worker at index 'i'.
  var spawn = function(i) {
      workers[i] = cluster.fork();

      // Optional: Restart worker on exit
      workers[i].on('exit', function(worker, code, signal) {
          console.log('respawning worker', i);
          spawn(i);
      });
  };
  // Spawn workers.
  for (var i = 0; i < num_processes; i++) {
      spawn(i);
  }
  //Helper function for getting a worker index based on IP address.
  // This is a hot path so it should be really fast. The way it works
  // is by converting the IP address to a number by removing the dots,
  // then compressing it to the number of slots we have.
  //
  // Compared against "real" hashing (from the sticky-session code) and
  // "real" IP number conversion, this function is on par in terms of
  // worker index distribution only much faster.
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
      // We received a connection and need to pass it to the appropriate
      // worker. Get the worker for this connection's source IP and pass
      // it the connection.
  	console.log("inside here " + connection.remoteAddress)
      var worker = workers[worker_index(connection.remoteAddress, num_processes)];
  	  worker.send('sticky-session:connection', connection);
  }).listen(3000);
  

} else {

	var init = require('./config/init')(),
	config = require('./config/config'),
	mongoose = require('mongoose');
	var sio = require('socket.io');
	var sio_redis = require('socket.io-redis');

	
	//Bootstrap db connection
	var db = mongoose.connect(config.db);
	//Init the express application
	var app = require('./config/express')(db);


	//Start the app by listening on <port>
	var server = app.listen(0, 'localhost');

	var io = sio(server);
	io.adapter(sio_redis({ host: 'localhost', port: 6379 }));
	
	var socketService = require('./app/services/sockets');
	socketService()['init'](io);
	
	
	// Listen to messages sent from the master. Ignore everything else.
    process.on('message', function(message, connection) {
    	 if (message !== 'sticky-session:connection') {
            return;
        }
    console.log( "msg " + message )
       
        // Emulate a connection event on the server by emitting the
        // event with the connection the master sent us.
    	console.log( connection )
        server.emit('connection', connection);
    });
	
	//Logging initialization
	console.log('MEAN.JS application started on port ' + config.port);
}

process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})