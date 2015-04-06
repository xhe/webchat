var country_service = require('../services/country');
var user_service = require('../services/user');
var core_service = require('../services/core');
var chat_service = require('../services/chat');
var invitation_service = require('../services/invitation');
var util = require('../services/utils');
var push_notification_service = require('../services/push_notify');
var swig = require('swig');
var mongoose = require('mongoose');
var Client = mongoose.model('Client');
var highlight_service = require('../services/highlight');
var relationship_service = require('../services/relationship');

exports.countries = function(req, res) {
	country_service.getAll(req, res);
};

exports.addUser = function(req, res) {
	user_service.createUser(req, res);
};

exports.login = function(req, res) {
	//console.log(" login... ")
	user_service.login(req, res);
};

exports.autologin = function(req, res) {
	user_service.autologin(req, res);
};

exports.upload_profile_file = function(req, res) {

	core_service.processProfileImages(req.files.photo.path, req.user, function(
			data) {
		if (data) {
			res.jsonp(req.user.photos);
		} else {
			res.end("failed");
		}
	});
};

exports.upload_chat_file = function(req, res) {
	// console.log("uploading here " + req.files.photo.path);
	chat_service.addPhotoForChatMessage(req.files.photo.path, req.user,
			req.params.roomId, function(message) {
				if (message) {
					// console.log("uploaded " ); console.log( message )
					res.jsonp(message);
				} else {
					res.end("failed");
				}
			});

};

exports.upload_chat_audio_file = function(req, res) {
	// console.log( req.files.audio.path )
	chat_service.addAudioForChatMessage(req.files.audio.path, req.user,
			req.params.roomId, function(message) {
				if (message) {
					res.jsonp(message);
				} else {
					res.end("failed");
				}
			});

};
exports.upload_chat_video_file = function(req, res, next) {
	// res.end("uploaded")

	var audioPath = req.files.audio ? req.files.audio.path : "";
	var videoPath = req.files.video ? req.files.video.path : "";

	chat_service.addVideoForChatMessage(audioPath, videoPath, req.user,
			req.params.roomId, function(err, message) {
				if (err) {
					return next(err);
				} else {
					res.jsonp(message);
				}
			});

};

exports.myphotos = function(req, res) {
	res.jsonp(req.user.photos);
};

exports.update_default = function(req, res) {
	req.user.updateDefaultHead(req.body.photoId, function() {
		res.jsonp({
			status : "success"
		});
	});
};

exports.update_photo = function(req, res) {
	req.user.updatePhotoDescription(req.body.photoId, req.body.title,
			req.body.description, function() {
				res.jsonp({
					status : "success"
				});
			});
};

exports.delete_photos = function(req, res) {
	req.user.removePhoto(req.body.photoIds, function() {
		res.jsonp({
			status : "success"
		});
	});
}

exports.delete_myphotos = function(req, res) {
	req.user.removePhoto(req.body.photoIds, function() {
		res.jsonp({
			status : "success"
		});
	});
}

exports.chatrooms = function(req, res) {

	chat_service.getUserRooms(req.user, function(err, result) {
		if (err) {
			res.jsonp({
				status : "failed"
			});
		} else {
			res.jsonp(result);
		}
	});
}

exports.createChatrooms = function(req, res) {
	req.user.createChatRoom(req.body.title, req.body.description,
			function(data) {
				res.jsonp(data);
			});
}

exports.deleteChatrooms = function(req, res) {
	req.user.deleteChatRoom(req.params.roomId, function(data) {
		res.jsonp(data);
	});
}

exports.search = function(req, res) {
	var type = req.params.type;
	if (type == "contacts") {
		var criterias = {
			phoneNumber : req.body.phoneNumber.toString().replace(/^\D+/g, ''),
			email : req.body.email,
			screenName : req.body.name
		};
		user_service.search_friends(criterias, req.user, function(data) {
			res.jsonp(data);
		});
	} else if (type == "contact") {
		user_service.search_friend(req.body.userId, function(data) {
			res.jsonp(data);
		});
	}
}

exports.invite = function(req, res) {
	var inviteeId = req.params.id;
	var msg = req.body.message;
	var roomId = req.body.roomId;
	var is_family = req.body.is_family;

	invitation_service.invite(req.user, inviteeId, msg, roomId, function(data) {
		if (data.status == 'success') {
			relationship_service.upsertRelationship(data.content.from,
					data.content.to, is_family, function(err, doc) {
						if (err) {
							res.jsonp({
								status : "failed",
								err : err
							});
						} else {
							res.jsonp(data);
						}
					});
		} else {
			res.jsonp(data);
		}
	});
}

exports.received_pending_invitations = function(req, res) {
	invitation_service.getMyInvitation(req.user,
			invitation_service.STATUS_PENDING, function(err,data) {
				if (err) {
					res.jsonp({
						status : "failed",
						err : err
					});
				} else {
					res.jsonp(data);
				}
			});
}

exports.accumulated_info = function(req, res) {
	async.parallel({
		pending_invitations : async.apply(invitation_service.getMyInvitation,
				req.user, invitation_service.STATUS_PENDING),
		total_new_msg : async.apply(chat_service.fetchUserTotalNewMsgs,
				req.user),
		total_new_highlights : async.apply(
				highlight_service.retrieveTotalNewHighlights, req.user)
	}, function(err, result) {
		if (err) {
			console.log(err)
			res.jsonp({
				status : 'failed'
			});
		} else {
			res.jsonp({
				status : 'success',
				payload : result
			})
		}
	});
};

exports.invitationDetail = function(req, res) {
	invitation_service.findInvitationById(req.params.id, function(inv) {
		if (inv) {
			relationship_service.findRelationship(inv.from, inv.to, function(
					err, doc) {
				if (doc) {
					inv['is_family'] = doc.is_family;
				} else {
					inv['is_family'] = false;
				}
				res.jsonp(inv);
			});
		} else {
			res.jsonp(inv);
		}
	});
}

exports.invitationReply = function(req, res) {
	invitation_service.replyInvitation(req.user, req.body.invitation_id,
			req.body.action, req.body.msg, function(data) {
				//console.log(data)
				if (data.status == 'success') {
					var inv = data.invitation;
					if (req.body.action == 'accept') {
						relationship_service.upsertRelationship(inv.to,
								inv.from, req.body.is_family,
								function(err, doc) {
									res.jsonp(data);
								});
					} else {
						relationship_service.removeRelationship(inv.from,
								inv.to, function(data) {
									res.jsonp(data);
								});
					}
				} else {
					res.jsonp(data);
				}
			}, false);
}

exports.chatmessages = function(req, res) {
	chat_service.retrieveChatMessages(req.user, req.params.roomId, null, null,
			function(data) {
				res.jsonp(data);
			});
}

exports.chatmessagesafter = function(req, res) {
	chat_service.retrieveChatMessages(req.user, req.params.roomId,
			req.params.endts, false, function(data) {
				res.jsonp(data);
			});
}

exports.chatmessagesbefore = function(req, res) {
	chat_service.retrieveChatMessages(req.user, req.params.roomId,
			req.params.endts, true, function(data) {
				res.jsonp(data);
			});
}

exports.addChatMessage = function(req, res) {
	chat_service.addChatMessage(req.user, req.body.roomId, null, req.body.message,
			function(data) {
				res.jsonp(data);
			});
}

exports.getContacts = function(req, res) {
	user_service.get_contacts(req.user.screenName, function(err, data) {
		res.jsonp(data);
	});
}

exports.getXirsysInfo = function(req, res) {
	util.getXirSysInfo(req.params.room, function(err, data) {
		res.jsonp(data);
	});
}

exports.call = function(req, res) {
	chat_service.call(req.body.type, req.user, req.body.user_name, function(
			err, response) {
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				roomName : response
			});
		}
	});
}

exports.android_register = function(req, res) {
	var regId = req.body.regId;
	push_notification_service.updateRegistrationId(req.user, regId,
			req.body.type, function(data) {
				res.jsonp(data);
			});
}

exports.ios_register = function(req, res) {
	push_notification_service.updateRegistrationId(req.user, req.body.regId,
			req.body.type, function(data) {
				res.jsonp(data);
			});
}

exports.refer = function(req, res) {
	user_service.refer(req.user, req.body.email, req.body.name,
			req.body.message, function(err, refer) {
				if (err) {
					res.jsonp({
						status : 'failed',
						err : err
					});
				} else {
					res.jsonp({
						status : 'success',
						refer : refer
					});
				}
			});
}

exports.resetPasswrod = function(req, res) {
	user_service.sendResetPwdEmail(req.body.email, function(err) {
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success'
			});
		}
	});
}

exports.getRefer = function(req, res) {
	user_service.getRefer(req.params.id, function(err, refer) {
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			var referNames = refer.name.split(" ");
			var client = new Client({
				email : refer.to,
				firstName : referNames.length > 0 ? referNames[0] : "",
				lastName : referNames.length > 1 ? referNames[1] : ""
			});
			res.jsonp({
				status : 'success',
				user : client
			});
		}
	});
},

exports.update_settings = function(req, res) {
	var settings = req.body.settings;
	req.user.settings_records_forever = req.body.records_forever;
	req.user.settings_records_days = req.body.records_days;
	req.user.settings_media_days = req.body.media_days;
	req.user.settings_disable_sounds = req.body.disable_sounds;
	req.user.save(function(err, doc) {
		res.jsonp({
			status : 'success',
			user : doc
		})
	});
},

exports.uploadTest = function(req, res, next) {
	res.end('finished')
};

exports.removeChatMessage = function(req, res, next) {
	chat_service.removeChatMsg(req.body.msgId, req.user, function(err, data) {
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success'
			});
		}
	});
};

exports.favorites = function(req, res) {
	highlight_service.retrieveHighlightLog( req.user, function(err, log){
		
		highlight_service.retrieveFavorites(req.user, null,
				req.params.period_from, req.params.period_to, function(err, data) {
			
			if (err) {
						res.jsonp({
							status : 'failed',
							err : err
						});
					} else {
						res.jsonp({
							status : 'success',
							contents : data,
							lastVisited: log?log.visited:null
						});
					}
				});
		
	});
	
	
};

exports.highlights = function(req, res) {
	highlight_service.retrieveHighlightLog( req.user, function(err, log){
		highlight_service.retrieveHighlights(req.user, req.params.owner, null,
				req.params.period_from, req.params.period_to, function(err, data) {
					if (err) {
						res.jsonp({
							status : 'failed',
							err : err
						});
					} else {
						res.jsonp({
							status : 'success',
							contents : data,
							lastVisited: log?log.visited:null
						});
					}
				});
	});
};

exports.highlightsbefore = function(req, res) {
	
	highlight_service.retrieveHighlightLog( req.user, function(err, log){
		highlight_service.retrieveHighlights(req.user, req.params.owner,
				req.params.ts, req.params.period_from, req.params.period_to,
				function(err, data) {
					if (err) {
						res.jsonp({
							status : 'failed',
							err : err
						});
					} else {
						res.jsonp({
							status : 'success',
							contents : data,
							lastVisited: log?log.visited:null
						});
					}
				});
	});
};

exports.save_highlight = function(req, res) {

	var originalPhotoIds = req.body.original_photos || [];
	var originalAudioIds = req.body.original_audios || [];
	originalPhotoIds = originalPhotoIds instanceof Array ? originalPhotoIds
			: [ originalPhotoIds ];
	originalAudioIds = originalAudioIds instanceof Array ? originalAudioIds
			: [ originalAudioIds ];

	var id = req.body.id ? (req.body.id == "null" ? null : req.body.id) : null;

	highlight_service.createHighlight(id, req.user, req.body.content, req.body.shared_link,
			req.body.shared, originalPhotoIds, originalAudioIds, req.files,
			function(err, data) {
				if (err) {
					res.jsonp({
						status : 'failed',
						err : err
					});
				} else {
					
					highlight_service.retrieveHighlightLinkMedia(data, function(err,data){
						res.jsonp({
							status : 'success',
							content : data
						});
					});
				}
			});
};

exports.save_highlightmedia = function(req, res) {
		highlight_service.save_highlightmedia(req.params.id, req.user, req.files, function(err, data) {
				if (err) {
					res.jsonp({
						status : 'failed',
						err : err
					});
				} else {
					res.jsonp({
						status : 'success',
						content : data
					});
				}
			});
};

exports.get_highlight = function(req, res) {
	highlight_service.findById(req.params.id, function(err, doc) {
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				content : doc
			});
		}
	});
};

exports.updateHighlight = function(req, res) {

	var originalPhotoIds = req.body.original_photos || [];
	var originalAudioIds = req.body.original_audios || [];
	originalPhotoIds = originalPhotoIds instanceof Array ? originalPhotoIds
			: [ originalPhotoIds ];
	originalAudioIds = originalAudioIds instanceof Array ? originalAudioIds
			: [ originalAudioIds ];
	highlight_service.updateHighlightContent(req.params.id, req.user,
			req.body.content, req.body.shared_link, req.body.shared, originalPhotoIds,
			originalAudioIds, function(err, data) {
				if (err) {
					res.jsonp({
						status : 'failed',
						err : err
					});
				} else {
					res.jsonp({
						status : 'success',
						content : data
					});
					
					//let's pull contents for link here
					highlight_service.retrieveHighlightLinkMedia(data, function(err, data){
					});
				}
			});
};

exports.delete_highlight = function(req, res) {
	highlight_service.deleteHighlight(req.params.id, req.user, function(err,
			doc) {
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				content : doc
			});
		}
	});
};

exports.updateRelationship = function(req, res) {
	relationship_service.updateRelationship(req.user, req.body.u,
			req.body.is_family, function(err, doc) {
				if (err) {
					res.jsonp({
						status : 'failed',
						err : err
					});
				} else {
					res.jsonp({
						status : 'success',
						content : doc
					});
				}
			});
};

exports.share_highlight_link = function(req, res){
	highlight_service.createHighlightWithLink(req.user, req.user.firstName+" "+req.user.lastName+" shared a link", req.params.link_id, function(err, doc){
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				content : doc
			});
		}
	});
};

exports.sharelinktoroom = function(req, res){
	chat_service.addChatMessage(req.user, req.body.room_id, req.body.link_id,  req.user.firstName+" "+req.user.lastName+" shared a link", 
			function(data) {
				res.jsonp(data);
			}
	);
};

exports.favorite_highlight = function(req, res){
	highlight_service.toggleFavorite(req.params.highlight_id, req.user, function(err, doc){
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				result : doc
			});
		}
	});
};

exports.findHighlightFromLink = function(req, res){
	highlight_service.findHighlightFromLink(req.body.link_id, function(err, docs){
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				result : docs[0]
			});
		}
	});
};

exports.addHighlightComment = function(req, res){
	highlight_service.addHighlightComment(req.user, req.params.highlight_id, req.body.comment,function(err, docs){
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				result : docs[0]
			});
		}
	});
};

exports.getMember = function(req, res){
	
	user_service.get_contact(req.user, req.params.id, function(err, data){
		if (err) {
			res.jsonp({
				status : 'failed',
				err : err
			});
		} else {
			res.jsonp({
				status : 'success',
				result : data
			});
		}
	});
};
