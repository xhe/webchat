var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Invitation = mongoose.model('Invitation')
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	socket_serivce = require('./sockets')(),
	utils = require('./utils')
	;

exports.STATUS_PENDING = 0;

exports.getMyInvitation = function(invitee, status, cb){
	console.log("here " + invitee._id +":"+status );
	
	Invitation.find({ to: new ObjectId(invitee._id), status: status})
				.sort('-created')
				.populate('from')
				.exec(function(err, docs){
					for(var i=0; i<docs.length; i++){
						docs[i].from = utils.simplifyUser(docs[i].from);
					}
					cb(docs);
				});
	
};

