var mongoose = require('mongoose'),
	Schema = mongoose.Schema
	;


var ChatRoomSchema = new Schema({
	
	name: String,
	creator: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Client'
			},
		
	created: {
		type: Date,
		default: Date.now
	},
	
	members:[{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Client'
				}]
});


mongoose.model('ChatRoom', ChatRoomSchema);