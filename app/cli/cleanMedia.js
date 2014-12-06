// format node cleanMedia.js days
var args = process.argv;
var days = args[2];

process.env.NODE_ENV = 'development';


var cli = require('../services/cli');
cli.cleanMedias( days, function(err, result){
	
	if(err){
		console.log('error');
		console.log(err);
	}else{
		console.log( 'finished' );
	}
	
	process.exit(0)
} );