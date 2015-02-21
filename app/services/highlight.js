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
	Highlight = mongoose.model('Highlight'),
	relationship_service = require('./relationship')
	;

exports.findById = function(id, cb){
	Highlight
		.findById(id)
		.populate("creator photos audios")
		.exec(function(err, doc){
			cb(err, doc);
		})
};

exports.retrieveHighlights = function(user, owner, before_ts, period_from, period_to, cb){
	
	var generateHighlightCreators = function(currentUser,  owner,  cb ){
		
		if(owner=='all_families'){
			relationship_service.retrieveRelatedUsers(currentUser, 1, cb );
			//find all familits
		} else if(owner=='all_friends') {
			relationship_service.retrieveRelatedUsers(currentUser, 2, cb );
			//find all friends
		} else if(owner=='all'){
			relationship_service.retrieveRelatedUsers(currentUser, 3, cb );
			//find all
		} else {
			if(owner!==user.screenName){
				//checking authority here
				relationship_service.detectRelationship( currentUser, owner, cb  );
			} else {
				cb ( null, [user] );
			}
		}
	};
	
	var obtainRelationshipLevels = function( currentUser, creators, cb ){
		var levelArray = {};
		relationship_service.retrieveRelationshipsBetween( currentUser, creators, function(err, docs){
			_.each(docs, function(doc){
				levelArray[doc.from.screenName] = doc.is_family;
			});
			
			cb(null, creators, levelArray);
		});
	};
	
	var findMsgByUsers = function(before_ts, period_from, period_to,  currentUser, creators, levelsArray,cb){
		
			var q= Highlight.find({
				creator:	
					{
						$in: creators
					}	
			});
			
			q.sort('-created');
			q.limit(20);
			q.populate('creator');
			q.populate('photos');
			q.populate('audios');
			if(before_ts){
				q.where('created').lt(before_ts);
			}
			if( period_from!=="null" && period_to!=="null") 
				q.where("created").gte(period_from).lt(period_to);
				
			q.exec(function(err, docs){
				var results = [];
				_.each(docs, function(doc){ 
					
					var toAdd = false;
					if(doc.shared == 0) { //only self
						if(doc.creator.screenName == currentUser.screenName )
							toAdd = true;
					} else if(doc.shared==1) { //family
						if( levelsArray[doc.creator.screenName] || doc.creator.screenName == currentUser.screenName)
							toAdd = true;
					} else if(doc.shared==2 ){ //friend
						if( !levelsArray[doc.creator.screenName] || doc.creator.screenName == currentUser.screenName)
							toAdd = true;
					}else { //all
						toAdd = true;
					}
					
					if(toAdd) {
						doc.date_str =  utils.generateDateStr(doc.created);
						results.push(doc);
					}
						
				});
				
				cb(err, results);
			});
	};
	

	async.waterfall(
			[
			 	async.apply( generateHighlightCreators, user, owner),
			 	async.apply( obtainRelationshipLevels, user),
			 	async.apply( findMsgByUsers, before_ts, period_from, period_to,  user)
			 ],
			 cb
	);
	
	/*
	Client.findByUsername( owner, function(err, doc){
		findMsgByUser(before_ts, doc, function(err, docs){
			cb(err, docs);
		});
	});
	
	var findMsgByUser = function(before_ts, creator, cb){
		if(creator==null){
			console.log( 'none creator ')
			cb(null, []);
		} else {
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
		}
	};
	*/
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
		
		if(  !(originalPhotoIds instanceof Array) && ( originalPhotoIds=="" || originalPhotoIds==null))
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
		
		if(  !(originalAudioIds instanceof Array) && (originalAudioIds=="" || originalAudioIds==null ))
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
//console.log( files )	
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
