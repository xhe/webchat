var mongoose = require('mongoose'),
	Schema = mongoose.Schema
	;
var deepPopulate = require('mongoose-deep-populate');

var fs = require('fs'),
	path = require('path'),
	async=require('async'),
	_=require('lodash')
;

var HighlightVisitLogSchema =  new Schema({
	visitor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	
	visited:{
		type: Date,
		default: Date.now
	}
});

var HighlightLinkSchema = new Schema(
	{
		link: String,
		title: String,
		msg: String,
		by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Client'
		},
		created:{
			type: Date,
			default: Date.now
		}
	}	
);

var FavoriteSchema = new Schema({
	
	
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	
	highlight: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Highlight'
	},
	
	created:{
		type: Date,
		default: Date.now
	}
	
});

var HighlightCommentSchema = new Schema({
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	comment: String,
	created:{
		type: Date,
		default: Date.now
	}
});

var HighlightSchema = new Schema({
	
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	
	contents: String,
	photos: [{
		type: mongoose.Schema.Types.ObjectId ,
		ref: 'PhotoSchema' 
	}],
	
	audios: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Audio' 
	}],
	
	shared_link: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'HighlightLink' 
	},
	
	shared: {
		type: Number,
		min: 0,
		max: 3
	},
	
	created: {
			type: Date,
			default: Date.now
		},
	
	favorited: {type: Boolean, default: true},
	
	date_str:String,
	
	comments:[
		          {
		        	  type: mongoose.Schema.Types.ObjectId,
		        	  ref: 'HighlightComment'
		          }
	          ]
});


HighlightSchema.plugin( deepPopulate  );

HighlightSchema.methods.removePhotos = function(photoIds, callback){ 
	
	var path_original = __dirname+'/../../www/uploads/original_highlight/';
	var path_thumb =  __dirname+'/../../www/uploads/thumb_highlight/';
	var _self = this;
	var _removePhoto = function(photoId, cb){
		var photo = _.find( _self.photos, function(photo){ return photo._id==photoId; } );
		if(fs.existsSync( path.join(path_original,photo.filename) ))
				fs.unlinkSync(path.join(path_original,photo.filename) );
				_.forEach(photo.renders, function(render){
					if(fs.existsSync(path.join(path_thumb,render.filename )))
						fs.unlinkSync(path.join(path_thumb,render.filename));
				});
		_self.photos.pull({ _id: new ObjectId(photoId )});
		cb(null);
	};
	async.map( photoIds, _removePhoto, function(err, results){
		_self.save( function(err, doc){
			callback(err, doc);
		})
	});
};

HighlightSchema.methods.removeAudios = function(audioIds, callback){
	
	var path_audio = __dirname+'/../../www';
	var _self = this;
	var _removeAudio = function(audioId, cb){
		var audio = _.find( _self.audios, function(audio){ return audio._id==audioId; } );
		if(fs.existsSync( path.join(path_audio,audio.filename) ))
				fs.unlinkSync(path.join(path_audio,audio.filename));
		_self.audios.pull({ _id: new ObjectId(audioId )});
		cb(null);
	};
	async.map( audioIds, _removeAudio, function(err, results){
		_self.save( function(err, doc){
			callback(err, doc);
		})
	});
};

HighlightSchema.statics.findByCreator = function(creator, cb){
	this.find({creator: creator}, function(err, docs){
		cb(err, docs);
	});
};

mongoose.model('Highlight', HighlightSchema);
mongoose.model('HighlightVisitLog', HighlightVisitLogSchema);
mongoose.model('HighlightLink',HighlightLinkSchema);
mongoose.model('Favorite', FavoriteSchema);
mongoose.model('HighlightComment',HighlightCommentSchema);