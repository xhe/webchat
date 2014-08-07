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
io.on('connection', function(){
	console.log('connected');
});


//Logging initialization
console.log('MEAN.JS application started on port ' + config.port);
