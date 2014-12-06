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
			if(stdout.indexOf('Orientation')>0){
				var orientationVal = stdout.substr( stdout.indexOf('Orientation')+12, 1 )
				if(orientationVal==6)
					rotation += ' -rotate 90 ';
			}
			exec('convert '+ imagePath +' -resize ' +' '+size +'x'+size+' '+rotation+' ' +filePath+'thumb/'+newName +' ',
					 function(err, stdout, stderr){
				render = new PhotoRender({
							filename: newName,
							dimension: size
				});
				cb(null, render);
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

exports.processChatImages = function(imagePath, user, roomId,  cb){	

	pos = imagePath.indexOf('uploads');
	fileName = imagePath.substr(pos+8);
	filePath = imagePath.substr(0,pos+8 );	
	ts = new Date().getTime();
	
	sizes = config.profile_image_sizes;
	

	var processImage = function(size, cb){
		var newName = user._id+"_"+size+"_"+ts+"_"+fileName;
		
		
		exec('identify  -format %[exif:*] '+imagePath, function(err, stdout, stderr){
			var rotation = ' -strip '; //remove exif meta data - for ios
			if(stdout.indexOf('Orientation')>0){
				var orientationVal = stdout.substr( stdout.indexOf('Orientation')+12, 1 )
				if(orientationVal==6)
					rotation += ' -rotate 90 ';
			}
			exec('convert '+ imagePath +' -resize ' +' '+size +'x'+size+' '+rotation+' ' +filePath+'thumb/'+newName +' ',
				function(err, stdout, stderr){
					render = new PhotoRender({
								filename: newName,
								dimension: size
					});
				cb(null, render);
			});
		});
		
	}
	
	async.map(sizes, processImage, function(err, results){
		
		photo = new Photo({
			use_as_head: false,
			filename: user._id+"_"+ts+"_"+fileName,		
		});
		photo.renders = results;
		wr = fs.createWriteStream( filePath+'original/'+user._id+"_"+ts+"_"+fileName);
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

