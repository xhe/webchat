// format node membership.js name days
var args = process.argv;
var days = args[3];
var name = args[2];
if(args.length!=4){
	console.log("please use format:  node membership.js name days ");
	process.exit(0);
}

process.env.NODE_ENV = 'development';


var cli = require('../services/cli');
cli.addMemberShip(name, new Date(), days, 1,  function(err, result){
	
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
