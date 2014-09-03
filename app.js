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
var cluster = require('cluster');

var workers = 1;// process.env.WORKERS || require('os').cpus().length;

if (cluster.isMaster) {

  console.log('start cluster with %s workers', workers);

  for (var i = 0; i < workers; ++i) {
    var worker = cluster.fork().process;
    console.log('worker %s started.', worker.pid);
  }

  cluster.on('exit', function(worker) {
    console.log('worker %s died. restart...', worker.process.pid);
    cluster.fork();
  });

} else {

	var init = require('./config/init')(),
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
}

process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})