var mongoose = require('mongoose'),
	Schema = mongoose.Schema
	;
var fs = require('fs'),
	path = require('path'),
	async=require('async'),
	_=require('lodash')
;


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
	
	shared: {
		type: Number,
		min: 0,
		max: 3
	},
	
	created: {
			type: Date,
			default: Date.now
		},
	date_str:String
});

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