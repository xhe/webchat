var config = require('../../config/config');
var mongoose = require('mongoose');

var fs = require('fs');
var img = require('easyimage');
var Photo = mongoose.model('PhotoSchema'),
	PhotoRender = mongoose.model('PhotoRenderSchema');

exports.processProfileImages = function(imagePath, user,  cb){	
	
	pos = imagePath.indexOf('uploads');
	fileName = imagePath.substr(pos+8);
	filePath = imagePath.substr(0,pos+8 );	
	
	
	photo = new Photo({
		use_as_head: (user.photos && user.photos.length>0)?false:true,
		filename: user._id+"_"+fileName,		
	});
	
	sizes = config.profile_image_sizes;
	finished = 0;
	for(var i=0; i<sizes.length; i++){
		
		(function(size){
			
			var newName = user._id+"_"+size+"_"+fileName;
			
			img.rescrop(
					{
						src: imagePath,
						dst: filePath+'thumb/'+newName,
						width: size,
						height: size
					},
					function(err, image){
						
						render = new PhotoRender({
							filename: newName,
							dimension: size
						});
						
						photo.renders.push(render);
						finished++;
						
						if(finished==sizes.length){
							user.photos.push(photo);
							user.save(function(err){
								if ( err ){
									console.log( err );
								}else{
									
									wr = fs.createWriteStream( filePath+'original/'+user._id+"_"+fileName);
									wr.on('close', function(ex){
										fs.unlink(imagePath);
										cb(true);
									});
									fs.createReadStream(imagePath).pipe(wr);
								}
								
							});
						}
							
					}
				);
			
			
		})(sizes[i]);
	}
};

exports.processChatImages = function(imagePath, user, roomId,  cb){	

	pos = imagePath.indexOf('uploads');
	fileName = imagePath.substr(pos+8);
	filePath = imagePath.substr(0,pos+8 );	
	
	photo = new Photo({
		use_as_head: false,
		filename: user._id+"_"+fileName,		
	});

	sizes = config.profile_image_sizes;
	finished = 0;
	for(var i=0; i<sizes.length; i++){
		
		(function(size){
			
			var newName = user._id+"_"+size+"_"+fileName;
			
			img.rescrop(
					{
						src: imagePath,
						dst: filePath+'thumb/'+newName,
						width: size,
						height: size
					},
					function(err, image){ 
						
						render = new PhotoRender({
							filename: newName,
							dimension: size
						});
						
						photo.renders.push(render);
						finished++;
				
						if(finished==sizes.length){
							wr = fs.createWriteStream( filePath+'original/'+user._id+"_"+fileName);
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
							
						}
							
					}
				);
			
		})(sizes[i]);
		
		
		
	}
};

