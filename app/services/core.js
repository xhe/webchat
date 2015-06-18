var config = require('../../config/config');
var mongoose = require('mongoose');

var fs = require('fs');
//var img = require('easyimage');
var Photo = mongoose.model('PhotoSchema'),
	PhotoRender = mongoose.model('PhotoRenderSchema');

var async = require('async');
var exec = require('child_process').exec;

exports.processProfileImages = function(imagePath, user,  cb){	
	
	pos = imagePath.indexOf('uploads');
	fileName = imagePath.substr(pos+8);
	filePath = imagePath.substr(0,pos+8 );	
	ts = new Date().getTime();
	sizes = config.profile_image_sizes;

	var processImage = function(size, cb){
		var newName = user._id+"_"+size+"_"+ts+"_"+ fileName;
		exec('identify  -format %[exif:*] '+imagePath, function(err, stdout, stderr){
			var rotation = ' -strip '; //remove exif meta data - for ios
			if(stdout.indexOf('Orientation=6')>-1){ //should be Orientation
				rotation += ' -rotate 90 ';
			}
			
			exec('identify ' + imagePath, function(err, stdout, stderr){
				var stdoutArray = stdout.split(' ');
				var dimArray = stdoutArray[2].split('x');
				var w= parseInt( dimArray[0] );
				var h= parseInt (dimArray[1]);
				var croppedSize = w>h?h:w;
				var cmd = 'convert '+ imagePath  + ' -gravity center -crop ' + croppedSize +'x'+croppedSize+'+0+0 '+' -resize '+size +'x'+size+' '+rotation + ' '+filePath+'thumb/'+newName +' ';
				
				if(size>100){
					cmd = 'convert '+ imagePath +' -resize ' +' '+size +'x'+size+' '+rotation+' '+filePath+'thumb/'+newName +' ';
				}
				console.log ( cmd )
				exec(cmd,
						function(err, stdout, stderr){
					render = new PhotoRender({
								filename: newName,
								dimension: size
					});
				cb(null, render);
				});
			});	
		});
	}
	async.map(sizes, processImage, function(err, results){
		
		photo = new Photo({
			use_as_head: (user.photos && user.photos.length>0)?false:true,
			filename: user._id+"_" + ts +"_"+fileName,		
		});

		photo.renders = results;
		user.photos.push(photo);
		user.save(function(err){
			if ( err ){
				console.log( err );
			}else{
				
				wr = fs.createWriteStream( filePath+'original/'+user._id+"_"+ts+"_"+fileName);
				wr.on('close', function(ex){
					fs.unlink(imagePath);
					cb(true);
				});
				fs.createReadStream(imagePath).pipe(wr);
			}
		});
	});
};

exports.processChatImages = function(imagePath, user, path_appendix, cb){	

	pos = imagePath.indexOf('uploads');
	fileName = imagePath.substr(pos+8);
	filePath = imagePath.substr(0,pos+8 );	
	ts = new Date().getTime();
	
	sizes = config.profile_image_sizes;
	

	var processImage = function(size, cb){
		var newName = user._id+"_"+size+"_"+ts+"_"+fileName;
		
		
		exec('identify  -format %[exif:*] '+imagePath, function(err, stdout, stderr){
			var rotation = ' -strip '; //remove exif meta data - for ios
			if(stdout.indexOf('Orientation=6')>-1){ //should be Orientation
				rotation += ' -rotate 90 ';
			}
			
			
			exec('identify ' + imagePath, function(err, stdout, stderr){
				var stdoutArray = stdout.split(' ');
				var dimArray = stdoutArray[2].split('x');
				var w= parseInt(dimArray[0]);
				var h= parseInt(dimArray[1]);
				
				
				var croppedSize = w>h?h:w;
				var cmd = 'convert '+ imagePath  + ' -gravity center -crop ' + croppedSize +'x'+croppedSize+'+0+0 '+' -resize '+size +'x'+size+' '+rotation + ' ' +filePath+'thumb' + path_appendix + '/'+ newName +' ';
				if(size>100){
					cmd = 'convert '+ imagePath +' -resize ' +' '+size +'x'+size+' '+rotation+' '+filePath+'thumb' + path_appendix + '/'+ newName +' ';
				}
				
				exec(cmd,
						function(err, stdout, stderr){
					render = new PhotoRender({
								filename: newName,
								dimension: size
					});
				cb(null, render);
				});
			});	
		});
		
	}
	
	async.map(sizes, processImage, function(err, results){
		
		photo = new Photo({
			use_as_head: false,
			filename: user._id+"_"+ts+"_"+fileName,		
		});
		photo.renders = results;
		wr = fs.createWriteStream( filePath+'original' + path_appendix +'/'+user._id+"_"+ts+"_"+fileName);
		wr.on('close', function(ex){
					fs.unlink(imagePath);
		});
		fs.createReadStream(imagePath).pipe(wr);
		photo.save(function(err){
			if(err){
				console.log(err);
			}else{ 
				cb(photo);
			}
		});
	});
	
};

