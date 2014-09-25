var fs = require("fs");
var finishedPoint = 45;
var finnab = function(i){
	if(i==0){
		return 0;
	}else if(i==1){
		return 1;
	}else{
		return finnab(i-1)+finnab(i-2);
	}
};

var d = new Date();
var startTS = d.getTime(); 
var run = 0;
for(var i=0; i<finishedPoint; i++)
	(
		function(i){
			var path = 'files/file_'+i+'.txt';
			console.log(i)
			buffer = new Buffer("i="+i+", result="+finnab(i));
			console.log('return ' +i);
			fs.open(path, 'w', function(err, fd) {
			    if (err) {
			        throw 'error opening file: ' + err;
			    } else {
			        fs.write(fd, buffer, 0, buffer.length, null, function(err) {
			            if (err) throw 'error writing file: ' + err;
			            fs.close(fd, function() {
			            	run++;
			            	if(run==finishedPoint){
			            		console.log(' finsihed now: ' + ( new Date().getTime() - startTS ) )
			            	}
			            })
			        });
			    }
			});
		}
	)(i);

