var mongoose = require('mongoose'),
	Schema = mongoose.Schema
	;

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
	
	created: {
			type: Date,
			default: Date.now
		}
});

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
	
	members:[{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Client'
				}]
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
    }
});

mongoose.model('ChatRoom', ChatRoomSchema);
mongoose.model('Invitation', InvitationSchema);
mongoose.model('ChatMessage', ChatMessageSchema);
mongoose.model('ChatRoomVisitLog', ChatRoomVisitLogSchema);