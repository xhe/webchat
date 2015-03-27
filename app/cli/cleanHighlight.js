// format node cleanHighlight.js days
var args = process.argv;
var days = args[2];
if(args.length!=3){
	console.log("please use format:  node cleanHighlight.js days ");
	process.exit(0);
}

process.env.NODE_ENV = 'development';


var cli = require('../services/cli');
cli.removeHighlights( days, function(err, result){
	
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
