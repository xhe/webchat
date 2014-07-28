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
	
	app.route('/api/upload_profile_file').post(user_service.requiresLogin,  api.upload_profile_file);
	
	
}