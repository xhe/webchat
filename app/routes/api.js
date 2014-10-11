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
	
	app.route('/api/chatrooms').get(user_service.requiresLogin,  api.chatrooms);
	app.route('/api/chatrooms').post(user_service.requiresLogin,  api.createChatrooms);
	app.route('/api/chatrooms/:roomId').delete(user_service.requiresLogin,  api.deleteChatrooms);
	
	app.route('/api/search/:type').post(user_service.requiresLogin,  api.search);
	app.route('/api/invite/:id').post(user_service.requiresLogin,  api.invite);
	
	app.route('/api/received_pending_invitations').get(user_service.requiresLogin,  api.received_pending_invitations);
	app.route('/api/invitation/:id').get(user_service.requiresLogin,  api.invitationDetail);
	
	app.route('/api/invitation').post(user_service.requiresLogin,  api.invitationReply);
	
	app.route('/api/chatmessages/:roomId').get(user_service.requiresLogin,  api.chatmessages);
	app.route('/api/chatmessages/:roomId/:endts').get(user_service.requiresLogin,  api.chatmessagesbefore);
	
	app.route('/api/chatmessages').post(user_service.requiresLogin,  api.addChatMessage);
	
	app.route('/api/contacts').get(user_service.requiresLogin,  api.getContacts);
	
	app.route('/api/upload_profile_file').post(user_service.requiresLogin,  api.upload_profile_file);
	app.route('/api/upload_chat_file/:roomId').post(user_service.requiresLogin,  api.upload_chat_file);
	
	app.route('/api/get_xirsys/:room').get(user_service.requiresLogin, api.getXirsysInfo);
	app.route('/api/call').post(user_service.requiresLogin, api.call); 
}