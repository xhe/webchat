var mongoose = require('mongoose'),
	Schema = mongoose.Schema
	;


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
    }
});

mongoose.model('ChatRoom', ChatRoomSchema);
mongoose.model('Invitation', InvitationSchema);