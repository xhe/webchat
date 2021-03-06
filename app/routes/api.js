var api = require('../controllers/api');
var user_service =  require('../services/user');

module.exports = function(app){
	
	app.route('/api/countries').get(api.countries);
	app.route('/api/users').post(api.addUser);
	app.route('/api/login').post(api.login);
	app.route('/api/autologin').post(api.autologin);
	
	app.route('/api/myphotos').get(user_service.requiresLogin,  api.myphotos);
	app.route('/api/update_default').post(user_service.requiresLogin,  api.update_default);
	app.route('/api/update_photo').post(user_service.requiresLogin,  api.update_photo);
	app.route('/api/myphotos').delete(user_service.requiresLogin,  api.delete_photos);
	app.route('/api/delete_myphotos').post(user_service.requiresLogin,  api.delete_myphotos);
	
	app.route('/api/chatrooms').get(user_service.requiresLogin,  api.chatrooms);
	app.route('/api/chatrooms').post(user_service.requiresLogin,  api.createChatrooms);
	app.route('/api/chatrooms/:roomId').delete(user_service.requiresLogin,  api.deleteChatrooms);
	
	app.route('/api/search/:type').post(user_service.requiresLogin,  api.search);
	app.route('/api/invite/:id').post(user_service.requiresLogin,  api.invite);
	
	app.route('/api/accumulated_info').get(user_service.requiresLogin,  api.accumulated_info);
	app.route('/api/received_pending_invitations').get(user_service.requiresLogin, api.received_pending_invitations);
	app.route('/api/invitation/:id').get(user_service.requiresLogin,  api.invitationDetail);
	
	app.route('/api/invitation').post(user_service.requiresLogin,  api.invitationReply);
	
	app.route('/api/chatmessages/:roomId').get(user_service.requiresLogin,  api.chatmessages);
	app.route('/api/chatmessages/:roomId/:endts').get(user_service.requiresLogin,  api.chatmessagesbefore);
	app.route('/api/chatmessages_after/:roomId/:endts').get(user_service.requiresLogin,  api.chatmessagesafter);
	
	app.route('/api/chatmessages').post(user_service.requiresLogin,  api.addChatMessage);
	app.route('/api/chatmessages').delete(user_service.requiresLogin,  api.removeChatMessage);
	
	app.route('/api/contacts').get(user_service.requiresLogin,  api.getContacts);
	
	app.route('/api/upload_profile_file').post(user_service.requiresLogin,  api.upload_profile_file);
	app.route('/api/upload_chat_file/:roomId').post(user_service.requiresLogin,  api.upload_chat_file);
	app.route('/api/upload_chat_video_file/:roomId').post(user_service.requiresLogin,  api.upload_chat_video_file);
	
	app.route('/api/upload_chat_audio_file/:roomId').post(user_service.requiresLogin,  api.upload_chat_audio_file);
	
	app.route('/api/get_xirsys/:room').get(user_service.requiresLogin, api.getXirsysInfo);
	app.route('/api/call').post(user_service.requiresLogin, api.call); 
	
	app.route("/api/android_register").post(user_service.requiresLogin, api.android_register );
	app.route("/api/ios_register").post(user_service.requiresLogin, api.ios_register );

	app.route('/api/resetPasswrod').post(api.resetPasswrod);
	app.route('/api/refer').post(user_service.requiresLogin, api.refer);
	app.route('/api/refer/:id').get(api.getRefer);
	
	app.route('/api/update_settings').post(user_service.requiresLogin, api.update_settings);
	
	app.route('/api/highlights/:owner').get(user_service.requiresLogin, api.highlights);
	app.route('/api/highlights/:owner/:ts').get(user_service.requiresLogin, api.highlightsbefore);
	app.route('/api/highlights/:owner/:period_from/:period_to').get(user_service.requiresLogin, api.highlights);
	
	
	app.route('/api/favorites/:period_from/:period_to').get(user_service.requiresLogin, api.favorites);
	app.route('/api/highlights/:owner/:period_from/:period_to/:ts').get(user_service.requiresLogin, api.highlightsbefore);
	
	
	app.route('/api/highlights').post(user_service.requiresLogin, api.save_highlight);
	app.route('/api/highlights/:id').post(user_service.requiresLogin, api.save_highlightmedia);
	app.route('/api/highlight/:id').get(user_service.requiresLogin, api.get_highlight);
	app.route('/api/highlight/:id').delete(user_service.requiresLogin, api.delete_highlight);
	
	app.route('/api/sharelink/:link_id').post(user_service.requiresLogin, api.share_highlight_link);
	app.route('/api/sharelinktoroom').post(user_service.requiresLogin, api.sharelinktoroom);
	app.route('/api/findHighlightFromLink').post( user_service.requiresLogin, api.findHighlightFromLink );
	
	
	app.route('/api/favorite/:highlight_id').post(user_service.requiresLogin, api.favorite_highlight);
	
	app.route('/api/highlight_comment/:highlight_id').post(user_service.requiresLogin, api.addHighlightComment);
	
	app.route('/api/updateHighlight/:id').post( user_service.requiresLogin, api.updateHighlight );
	app.route('/api/relationship').put( user_service.requiresLogin, api.updateRelationship);
	
	app.route('/api/member/:id').get( user_service.requiresLogin, api.getMember );
	
	app.route('/api/uploadTest').post(api.uploadTest);
}