// format node cleanChatAndMedia.js maxNumToProcess daysBefore
var args = process.argv;
if(args.length!=4){
	console.log("please use format:  node cleanChatAndMedia.js maxNumToProcess daysBefore  ");
	process.exit(0);
}
var max = args[2];
var days = args[3];

process.env.NODE_ENV = 'development';


var cli = require('../services/cli');
cli.cleanChatAndMedia( max, days, function(err, result){
	
	if(err){
		console.log('error');
		console.log(err);
		logError( err, function(){
			process.exit(1);
		});
	}else{
		console.log( 'finished' );
		process.exit(0)
	}
} );

var fs = require('fs');
var logError=function(err, cb){
	var errStr = err.message+'\n'+ err.stack;
	 fs.open('error_log','a', function(err, fd){
		 if(err){
			 console.log(err);
		 }else{
			 var buffer = new Buffer( new Date().toUTCString() +":" + errStr +'\n'
					  );
					  fs.write(fd, buffer, 0, buffer.length, null, function(err) {
						 fs.close(fd); 
						 cb();
					  });
		 }
	  });
}
