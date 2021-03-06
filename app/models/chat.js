var mongoose = require('mongoose'),
	Schema = mongoose.Schema
	;
var fs = require('fs'),
	path = require('path')
;
var deepPopulate = require('mongoose-deep-populate');

var AudioSchema = new Schema({
	filename: String,
	created: {
			type: Date,
			default: Date.now
		}
});

AudioSchema.post('remove', function(doc){
	var path =  __dirname+'/../../www/uploads/audio/'; 
	fs.unlinkSync(   path.join(path, doc.filename) )
});

var VideoSchema = new Schema({
	filename: String,
	created: {
		type: Date,
		default: Date.now
	}
});

VideoSchema.post('remove', function(doc){
	var path =  __dirname+'/../../www/uploads/video/';
	fs.unlinkSync(   path.join(path, doc.filename) )
});

var ChatMessageSchema = new Schema({
	
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	
	room: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ChatRoom'
	},
	
	message: String,
	
	photo: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'PhotoSchema' 
	},
	
	audio: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Audio' 
	},
	
	video: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Video' 
	},
	
	created: {
			type: Date,
			default: Date.now
		},
	date_str:String,
	
	shared_link: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'HighlightLink' 
	},
});

ChatMessageSchema.plugin( deepPopulate  );

var ChatRoomVisitLogSchema =  new Schema({
	visitor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	
	room: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ChatRoom'
	},
	
	visited:{
		type: Date,
		default: Date.now
	}
});

var ChatRoomSchema = new Schema({
	
	name: String,
	creator: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Client'
			},
	description: String,
	
	created: {
		type: Date,
		default: Date.now
	},
	
	new_messages: Number,
	
	members:[{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Client'
				}]
});

ChatRoomSchema.methods.havingUnviewedMsg = function(user, room, cb){
	ChatRoomVisitLog
		.findOne({
			visitor: user,
			room: room
		})
		.exec(function(err, doc){
			var lastVisit = null;
			if(doc){
				lastVisit = doc.visited;
			}
			var query = { room: room }
			if(lastVisit){
				query['created'] =  { $gte: lastVisit };
			}
			ChatMessage.count(query, function(err, count){
				cb(count);
			});
		});
	
};

var ReferSchema = new Schema({
   from: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
   },
   to: {
		type: String
   },
   name: {
	   type: String
   },
   message: {
  		type: String,
		default: '',
		trim: true,
   },
   status:{
  		type: Number,
  		default: 0,
   },
   created: {
		type: Date,
		default: Date.now
	},
   updated: {
   		type: Date,
		default: Date.now
   }
});

ReferSchema.statics.findByEmail = function(email, cb){
	this.findOne({to: email}, function(err, refer){
		cb(err, refer);
	});
};

var RelationshipSchema = new Schema({
	from: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	to: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
	},
	is_family: {
		type: Boolean, 
		default: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
    	type: Date,
		default: Date.now
    }
});

var InvitationSchema = new Schema({
	from: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Client'
		   },
	to: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client'
   },
   message: {
	   		type: String,
   			default: '',
   			trim: true,
   },
   status:{
	   		type: Number,
	   		default: 0,
   },
   reply: {
	   	type: String,
		default: '',
		trim: true,
   },
   room: {
  		type: mongoose.Schema.Types.ObjectId,
		ref: 'ChatRoom'
   },
   created: {
		type: Date,
		default: Date.now
	},
    updated: {
    	type: Date,
		default: Date.now
    },
    seen: {
    	type: Boolean,
    	default: false
    },
    is_family: {
		type: Boolean, 
		default: true
	},
});

mongoose.model('ChatRoom', ChatRoomSchema);
mongoose.model('Invitation', InvitationSchema);
mongoose.model('ChatMessage', ChatMessageSchema);
mongoose.model('ChatRoomVisitLog', ChatRoomVisitLogSchema);
mongoose.model('Audio', AudioSchema);
mongoose.model('Video', VideoSchema);
mongoose.model('Refer', ReferSchema);
mongoose.model('Relationship', RelationshipSchema);