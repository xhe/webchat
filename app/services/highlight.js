var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	utils = require('./utils'),
	core_service = require('./core'),
	Audio = mongoose.model('Audio'),
	Video = mongoose.model('Video'),
	_ = require('lodash'),
	async = require('async'),
	fs = require('fs'),
	Highlight = mongoose.model('Highlight')
	;

exports.findById = function(id, cb){
	Highlight
		.findById(id)
		.populate("creator photos audios")
		.exec(function(err, doc){
			cb(err, doc);
		})
};

exports.retrieveHighlights = function(user, owner, before_ts, cb){
	
	if(owner!==user.screenName){
		//checking authority here
	}
	
	var findUser = function(name, cb){
		Client.findByUsername( name, cb);
	};
	
	var findMsgByUser = function(before_ts, creator, cb){
		
		var q= Highlight.find({
			creator:	creator
		});
		
		q.sort('-created');
		q.limit(20);
		q.populate('creator');
		q.populate('photos');
		q.populate('audios');
		if(before_ts){
			q.where('created').lt(before_ts);
		}
		
		q.exec(function(err, docs){
			_.each(docs, function(doc){
				doc.creator = utils.simplifyUser(doc.creator, true);
			});
			cb(err, docs);
		});
		
	};
	
	async.waterfall([
	                  async.apply( findUser, owner),
	                  async.apply( findMsgByUser, before_ts )
	                 ], cb);
};

exports.deleteHighlight = function(id, deletor, cb){
	
	var findHighlight = function(id, cb){
		Highlight.findOne({ _id: id})
		.populate("creator photos audios")
		.exec(function(err, doc){
			cb(err, doc);
		});
	};
	
	var checkAutheticate = function(deletor, highlight, cb){
		if(deletor.screenName==highlight.creator.screenName){
			cb(null, highlight);
		}else{
			cb("Unauthorized User");
		}
	};
	
	var removeHighlightPhotos = function(highlight, cb){
		highlight.removePhotos(_.pluck(highlight.photos, function(photo){ return photo._id }), function(err, doc){
			cb(err, doc);
		});
	};
	
	var removeHighlightAudios = function(highlight, cb){
		highlight.removeAudios(_.pluck(highlight.audios, function(audio){ return audio._id }), function(err, doc){
			cb(err, doc);
		});
	};
	
	var removeHighlight = function(highlight, cb){
		highlight.remove(function(err, doc){
			cb(err, doc);
		})
	};
	
	async.waterfall([
	                 	async.apply( findHighlight, id),
	                 	async.apply( checkAutheticate, deletor),
	                 	async.apply( removeHighlightPhotos ),
	                 	async.apply( removeHighlightAudios ),
	                 	async.apply( removeHighlight )
	                 ], cb );
	
}


var updateHightContent = function(id, creator, content, shared, originalPhotoIds, originalAudioIds, cb ){
	
	var findHighlight = function(id, cb){
		_self = this;
		Highlight.findOne({ _id: id})
		.populate("photos audios creator")
		.exec(function(err, doc){
			cb(err, doc);
		});
	};
	
	var checkAutheticate = function(creator, highlight, cb){
		if(creator.screenName==highlight.creator.screenName){
			cb(null, highlight);
		}else{
			cb("Unauthorized User");
		}
	};
	
	var _updateHighlightContent = function(content, shared, highlight, cb ){
		
		if( content && content.length>0 && shared!=null ){
			highlight.contents = content;
			highlight.shared = shared;
			highlight.save(function(err, doc){
				cb(err, doc);
			});
		}else{
			cb(null, highlight);
		}
	};
	
	var processOriginalPhotos = function(originalPhotoIds, highlight, cb){
		
		if( originalPhotoIds=="" || originalPhotoIds==null)
			cb(null, highlight);
		else{
			var ids = [];
			_.each(highlight.photos, function(photo){
				var exist = false;
				_.each(originalPhotoIds, function(originalPhotoId){
					if( originalPhotoId==photo._id.toString()){
						exist = true;
					}
				});
				
				if(!exist )
					ids.push(photo._id);
			});
			highlight.removePhotos(ids, function(err, doc){
				cb(err, doc);
			});
		}
	};

	var processOriginalAudios = function(originalAudioIds, highlight, cb){
		
		if( originalAudioIds=="" || originalAudioIds==null )
			cb(null, highlight);
		else {
			var ids = [];
			_.each(highlight.audios, function(audio){
				var exist = false;
				_.each(originalAudioIds, function(originalAudioId){
					if( originalAudioId==audio._id.toString())
						exist = true;
				});
				
				if(!exist )
					ids.push(audio._id);
			});
			highlight.removeAudios(ids, function(err, doc){
				cb(err, doc);
			});
		}
	};

	async.waterfall(
			[
              async.apply( findHighlight, id),
              async.apply( checkAutheticate, creator),
              async.apply( _updateHighlightContent, content, shared ),
              async.apply( processOriginalPhotos, originalPhotoIds),
              async.apply( processOriginalAudios, originalAudioIds)
            ], 
            function(err, data){
				cb( err, data );
			}
		);
	
};


exports.updateHighlightContent = function(id, creator, content, shared, originalPhotoIds, originalAudioIds, cb){
	updateHightContent(id, creator, content, shared, originalPhotoIds, originalAudioIds, cb);
};

exports.createHighlight = function(id, creator, content, shared, originalPhotoIds, originalAudioIds, files, cb ){
	
	var createHighlightRecord = function(creator, contents, shared, cb){
		var highlight = new Highlight({
			contents: contents,
			shared: shared,
			creator: creator
		});
		highlight.save(function(err, doc){
			cb(err, doc);
		})
	};
	
	
	var processImage = function(highlight, file, cb){
		
		imagePath = file.path;
		core_service.processChatImages( imagePath, creator, '_highlight', function(photo){
			highlight.photos.push(photo);
			highlight.save(function(err, doc){
				cb(null, doc);
			});
		});
	};
	
	var processAudio = function( highlight, file, cb){
		
		audioPath = file.path;
		pos = audioPath.indexOf('uploads');
		fileName = audioPath.substr(pos+8);
		filePath = audioPath.substr(0,pos+8 );	
		ts = new Date().getTime();
		
		wr = fs.createWriteStream( filePath+'audio_highlight/'+creator._id+"_"+ts+"_"+fileName);
		wr.on('close', function(ex){
			fs.unlink(audioPath);
		});
		fs.createReadStream(audioPath).pipe(wr);
		
		var audio = new Audio({
			filename: '/uploads/audio_highlight/'+creator._id+"_"+ts+"_"+fileName
		});
		
		audio.save(function(err, doc){
			highlight.audios.push( doc );
			highlight.save(function(err, doc){
				cb(null, doc);
			});
		});
	};
	
	var processMedias = function( files, highlight, cb ){
		
		files.photos = files.photos?files.photos:[];
		files.audios = files.audios?files.audios:[];
		
		if( !( files.photos instanceof Array ) ){
			files.photos = [files.photos];
		}
		if( !( files.audios instanceof Array ) ){
			files.audios = [files.audios];
		}
		
		async.mapSeries( files.photos, async.apply( processImage, highlight), function(err){
			if(err)
				cb(err);
			else
				async.mapSeries( files.audios, async.apply(processAudio, highlight) , function(err){
					cb(err, highlight);
				});
		});
	};

	if(id){
		async.waterfall(
				[
                  async.apply( updateHightContent, id, creator, content, shared, originalPhotoIds, originalAudioIds),
                  async.apply( processMedias, files )
                ], 
                function(err, data){
					cb( err, data );
				}
			);
	}else{ 
		async.waterfall(
				[
                  async.apply( createHighlightRecord, creator, content, shared),
                  async.apply( processMedias, files )
                ], 
                function(err, data){
					cb( err, data );
				}
			);
	}
}
