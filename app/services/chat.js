var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Invitation = mongoose.model('Invitation'),
	crypto = require('crypto'),
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId
	;

exports.invite = function(invitor, inviteeId, msg, cb){
		
	Client.findById(new ObjectId(inviteeId), function(err, invitee){
		
		if(err){
			cb({status: 'failed', error: err})
		}else{
			Invitation.find(
					{
						from: invitor._id,
						to:	  invitee._id
					}, function(err, docs){
						if(docs.length>0){
							cb({status: 'failed', error: 'You have invited the person already, no need to invite again'});
						}else{
							invitation = new Invitation({
								from: invitor._id,
								to:	  invitee._id,
								message: msg,
								status: 0
							});
							invitation.save(function(err){
								if(err){
									cb({status:"failed", error: err});
								}else{
									cb({status:"success", content: invitation });
								}
							});
						}
					});
		}
	});
};
