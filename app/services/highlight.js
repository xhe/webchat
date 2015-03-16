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
	relationship_service = require('./relationship'),
	HighlightVisitLog = mongoose.model('HighlightVisitLog'),
	HighlightLink = mongoose.model('HighlightLink'),
	Favorite =  mongoose.model('Favorite'),
	PhotoSchema = mongoose.model('PhotoSchema'),
	Audio = mongoose.model('Audio'),
	ChatMessage=mongoose.model('ChatMessage')
	;

exports.findById = function(id, cb){
	Highlight
		.findById(id)
		.populate("creator photos audios")
		.populate("shared_link")
		.exec(function(err, doc){
			cb(err, doc);
		})
};

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

exports.retrieveFavorites = function(user, before_ts, period_from, period_to, cb){
	
		
		var q = Favorite.find({
			owner: user
		});
		q.sort('-created');
		q.limit(20);
		q.populate("highlight");
		if(before_ts){
			q.where('created').lt(before_ts);
		}
		
		if( period_from!=="null" && period_to!=="null") 
			q.where("created").gte(period_from).lt(period_to);
		
		q.exec(function(err, docs){
			/*
			var populate = function(path, model, cb){
				HighlightLink.populate(docs,{
					path: path,
					model:model 
				}, 
				cb);
			}
			
			async.waterfall([
			                async.apply( HighlightLink.populate, docs, { path: 'highlight.shared_link', model:HighlightLink }),
			                async.apply( HighlightLink.populate, docs, { path: 'highlight.creator', model: Client}),
			                async.apply( HighlightLink.populate, docs, { path: 'highlight.photos', model:PhotoSchema }),
			                async.apply( HighlightLink.populate, docs, { path: 'highlight.audios', model:Audio }),
			                ], 
			                function(err, data){
								var results = [];
								_.each(docs, function(doc){
									doc.date_str =  utils.generateDateStr(doc.created);
									results.push(doc.highlight);
								});
								cb(err, results);
							}
			);
			*/
		
			
			HighlightLink.populate(docs,{
				path: 'highlight.shared_link',
				model:HighlightLink 
			}, 
				function(err, data){
				
					HighlightLink.populate(docs,{
						path: 'highlight.creator',
						model:Client 
					}, function(err, data){
						
						HighlightLink.populate(docs,{
							path: 'highlight.photos',
							model:PhotoSchema 
						}, function(err, data){
							HighlightLink.populate(docs,{
								path: 'highlight.audios',
								model:Audio 
							}, function(err, data){
								var results = [];
								_.each(docs, function(doc){
									doc.date_str =  utils.generateDateStr(doc.created);
									results.push(doc.highlight);
								});
								cb(err, results);
							});
						});
					});
				}
			);
			
			
		});
	
	
	
};

exports.retrieveHighlights = function(user, owner, before_ts, period_from, period_to, cb){
	
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
			q.populate('shared_link');
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
	
	var populateFavorite = function(user, highlights, cb){
		var q= Favorite.find({
			highlight:	
				{
					$in: highlights
				},
			owner: user
		});
		
		q.exec(function(err, docs){
			for(var i=0; i<highlights.length; i++){
				highlights[i]['favorited'] = false;
				for(var j=0;j<docs.length;j++){
					if(docs[j].highlight.toString()==highlights[i]._id){
						highlights[i]['favorited'] = true;
						break;
					}
				}
			}
			cb( err, highlights );
		});
	};
	
	
	async.parallel(
			{
				updateLog: function(cb){
					var query = {visitor: user};
					var update = {visited: new Date() };
					var options = { upsert: true };
					HighlightVisitLog.findOneAndUpdate(query, update, options, cb);
				},
				retrieveHighlights: function(cb){
					async.waterfall(
							[
							 	async.apply( generateHighlightCreators, user, owner),
							 	async.apply( obtainRelationshipLevels, user),
							 	async.apply( findMsgByUsers, before_ts, period_from, period_to,  user),
							 	async.apply( populateFavorite, user)
							 ],
							 cb
					);
				}
			},
			function(err, result){
				cb(err, result["retrieveHighlights"] );
			}
	);
};

exports.retrieveTotalNewHighlights = function(user, cb){
	
	var findTotalNewHighlights = function(user, creators, cb){
		HighlightVisitLog.findOne({visitor: user}, function(err, highlightVisitLog){
			if(err){
				cb(err);
			} else {
				var q= Highlight.find(
						{	$and: [
									{
										creator:	
										{
											$in: creators
										}	
									},
									{
										creator:	
										{
											$ne: user
										}	
									}
						       
						       ]
						}
						);
				if(highlightVisitLog){
					q.where('created').gt(highlightVisitLog.visited);
				}
				q.count(function(err, total){
					cb(err, total);
				})
			}
		});
	};
	async.waterfall([
	                 	async.apply( generateHighlightCreators, user, "all"),
	                 	async.apply( findTotalNewHighlights, user )
	                 ], cb);
};

var checkRefereCountForLink = function(link, cb){
	Highlight.where({"shared_link": link}).count(function(err, cn1){
		ChatMessage.where({"shared_link": link}).count(function(err, cn2){
			cb(err, cn1+cn2);
		});
	});
};

exports.deleteHighlight = function(id, deletor, cb){
	
	var findHighlight = function(id, cb){
		Highlight.findOne({ _id: id})
		.populate("creator photos audios shared_link")
		.exec(cb);
	};
	
	var checkAutheticate = function(deletor, highlight, cb){
		if(deletor.screenName==highlight.creator.screenName){
			cb(null, highlight);
		}else{
			cb("Unauthorized User");
		}
	};
	
	var removeHighlightPhotos = function(highlight, cb){
		highlight.removePhotos(_.pluck(highlight.photos, function(photo){ return photo._id }), cb);
	};
	
	var removeHighlightLink = function(highlight, cb){
		
		if(highlight.shared_link){
			//checking total reference
			checkRefereCountForLink(highlight.shared_link, function(err, count){
				if(err){
					cb(err);
				}else {
					if( count==1 ){
						//only delete the link obj if it is ONLY referered by this highlight
						highlight.shared_link.remove(function(err, doc){
							cb(err, highlight);
						});
					} else {
						cb(null, highlight);
					}
				}	
			});
			
		}else{
			cb(null, highlight);
		}
	};
	
	var removeFavorite = function(highlight, cb){
		Favorite.remove({ highlight: highlight }, function(err, docc){
			cb(err, highlight);
		});
	};
	
	
	var removeHighlightAudios = function(highlight, cb){
		highlight.removeAudios(_.pluck(highlight.audios, function(audio){ return audio._id }), cb);
	};
	
	var removeHighlight = function(highlight, cb){
		highlight.remove(cb)
	};
	
	async.waterfall([
	                 	async.apply( findHighlight, id),
	                 	async.apply( checkAutheticate, deletor),
	                 	async.apply( removeHighlightPhotos ),
	                 	async.apply( removeHighlightAudios ),
	                 	async.apply( removeHighlightLink ),
	                 	async.apply( removeFavorite),
	                 	async.apply( removeHighlight ),
	                 ], cb );
	
}


var updateHightContent = function(id, creator, content, shared_link, shared, originalPhotoIds, originalAudioIds, cb ){
	
	var findHighlight = function(id, cb){
		_self = this;
		Highlight.findOne({ _id: id})
		.populate("photos audios creator")
		.populate("shared_link")
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
	
	var _updateSharedlink = function(shared_link_link, creator,  highlight, cb){
		
		if(highlight.shared_link){
			
			if(shared_link_link){ 
				HighlightLink.findByIdAndUpdate(highlight.shared_link._id, { $set: { link: shared_link_link, title: "", msg:"" }}, function (err, link) {
					  if (err) { 
						  cb(err);
					  }else {
						  highlight.shared_link = link;
						  cb(null, highlight);
					  }
					});
			} else {
				//double check if other is referring
				HighlightLink.remove({ _id:highlight.shared_link._id}, function(err) {
				    if (err) {
				    	cb(err);
				    }
				    else {
				    	highlight.shared_link = null;
				        cb(null, highlight);
				    }
				});
			}
		} else {
			if(shared_link_link && shared_link_link.length>0){
				var highlightLink = new HighlightLink({
					link: shared_link_link,
					by: creator
				});
				highlightLink.save(function(err, shared_link){
					highlight.shared_link = shared_link;
					cb(null, highlight);
				});
			} else {
				//do nothing here
				cb( null, highlight);
			}
		}
	};
	
	
	var _updateHighlightContent = function(content,shared, highlight, cb ){
		if( content && content.length>0 && shared!=null){
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
              async.apply( _updateSharedlink, shared_link, creator ),
              async.apply( _updateHighlightContent, content, shared ),
              async.apply( processOriginalPhotos, originalPhotoIds),
              async.apply( processOriginalAudios, originalAudioIds)
            ], 
            function(err, data){
				cb( err, data );
			}
		);
	
};


exports.updateHighlightContent = function(id, creator, content,shared_link, shared, originalPhotoIds, originalAudioIds, cb){
	updateHightContent(id, creator, content, shared_link, shared, originalPhotoIds, originalAudioIds, cb);
};

exports.createHighlightWithLink = function(creator, content, sharedLinkId, cb){
	
	var retrieveLinkObj = function(sharedLinkId, cb){
		HighlightLink.findById( sharedLinkId, cb);
	};
	
	var createHighlight = function(creator, content, link, cb){
		
		Highlight.find({ shared_link:link, creator: creator }).exec(function(err, highlight){
			
			if(highlight.length==0){
				
				var highlight = new Highlight ({
					contents: content,
					shared: 3,
					creator: creator,
					shared_link: link
				});
				highlight.save(cb);
			} else {
				cb(null, highlight);
			}
		});
	};
	
	async.waterfall([
	                 	async.apply(retrieveLinkObj, sharedLinkId),
	                 	async.apply(createHighlight, creator, content)
	                 ], cb);
};


exports.createHighlight = function(id, creator, content, shared_link, shared, originalPhotoIds, originalAudioIds, files, cb ){

	var createHighlightRecord = function(creator, contents, shared_link, shared, cb){
	
		
		if(shared_link!=null && shared_link.length>0){
			var highlightLink = new HighlightLink({
				link: shared_link,
				by: creator
			});
			highlightLink.save(function(err, doc){
				
				var highlight = new Highlight({
					contents: contents,
					shared: shared,
					creator: creator,
					shared_link: doc
				});
				highlight.save(function(err, h){
					cb(err, h);
				});
			});
		} else {
			
				var highlight = new Highlight({
					contents: contents,
					shared: shared,
					creator: creator
				});
				highlight.save(function(err, h){
					cb(err, h);
				});
		}
		
		
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
			else{
				async.mapSeries( files.audios, async.apply(processAudio, highlight) , function(err, data){
					cb(err, highlight);	
				});
			}
				
		});
	};

	if(id){
		async.waterfall(
				[
                  async.apply( updateHightContent, id, creator, content, shared_link, shared, originalPhotoIds, originalAudioIds),
                  async.apply( processMedias, files ),
                  async.apply( retrieveHighlightLinkMedia)
                ],
                cb
			);
	}else{ 
		async.waterfall(
				[
                  async.apply( createHighlightRecord, creator, content, shared_link, shared),
                  async.apply( processMedias, files ),
                  async.apply( retrieveHighlightLinkMedia)
                ],
                cb
			);
	}
}

var retrieveHighlightLinkMedia = function(highlight, cb){
	
		if(highlight.shared_link!=null){
			Highlight.findOne({_id: highlight._id}).populate('shared_link').exec(function(err, highlight){
				utils.get(highlight.shared_link.link, function(err, data){
					var title, subTitle;
					if(highlight.shared_link.link.indexOf("weixin.qq.com")>0){
						title=data.match(/<title>([^<]+)<\/title>/)[1];
						subTitle = data.match(/<h2.*>(.*)<\/h2>/)[1];
					}
					if( title.trim() != "")
						highlight.shared_link.title = title;
					if( subTitle.trim() != "")
							highlight.shared_link.msg = subTitle.trim();
		
					highlight.shared_link.save(function(err, doc){
						cb(err, highlight);
					});
				});
			});
		} else {
			cb( null, highlight );
		}
};

exports.addFavorite = function(highlight_id, user, cb){
	
	var findHighlight = function(id, cb){
		Highlight.findOne({_id: id}).exec(cb);
	}
	
	var createFavorite = function(user, highlight, cb){
		
		Favorite.where({owner: user, highlight: highlight}).count(function(err, count){
			if(count==0){
				var favorite = new Favorite({
					owner: user,
					highlight: highlight
				});
				favorite.save(cb);
			}else{
				Favorite.findOne({ owner: user, highlight: highlight }).exec(cb);
			}
		});
	}
	async.waterfall([
	                 	async.apply(findHighlight,highlight_id),
	                 	async.apply(createFavorite, user)
	                 ], cb);
};


exports.toggleFavorite = function(highlight_id, user, cb){
	
	var findHighlight = function(id, cb){
		Highlight.findOne({_id: id}).exec(cb);
	}
	
	var findFavorite = function(user, highlight, cb){
		Favorite.find({
			owner: user,
			highlight: highlight
		}).exec(function(err, favorites){
			cb(err, highlight, favorites);
		});
	}
	
	var toggleFavorite = function(user, highlight, favorites, cb){
		
		var status = "favorited";
		
		if(favorites.length>0){
			favorites[0].remove( function(err, fav){
				
				cb(err,
					{
						status: "unfavorited",
						doc: fav
					}
				);
				
			});
		} else {
			var favorite = new Favorite({
				owner: user,
				highlight: highlight
			});
			favorite.save(function(err, doc){
				cb(err,
						{
							status: "favorited",
							doc: doc
						}
					);
			});
		}
	}
	
	async.waterfall([
	                 	async.apply( findHighlight,highlight_id),
	                 	async.apply( findFavorite, user),
	                 	async.apply( toggleFavorite, user )
	                 ], cb);
};

exports.findHighlightFromLink = function(link_id, cb){
	Highlight.find({shared_link: new ObjectId(link_id)}).populate("shared_link").limit(1).exec(function(err, docs){
		cb(err, docs);
	});
};