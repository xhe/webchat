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
	
	Invitation.find({ to: new ObjectId(invitee._id), status: status})
				.sort('-created')
				.populate('from')
				.exec(function(err, docs){
					for(var i=0; i<docs.length; i++){
						docs[i].from = utils.simplifyUser(docs[i].from, true);
					}
					cb(docs);
				});
};

exports.findInvitationById = function(id, cb){
	Invitation.findById( new ObjectId(id))
			  .populate('from')
			  .exec(function(err, invitation){
				 invitation.from = utils.simplifyUser(invitation.from , true); 
				 cb(invitation);
			  });
	;
};

