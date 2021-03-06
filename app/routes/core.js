var core = require('../controllers/core')
module.exports = function(app){
	
	app.get('/*', function(req, res, next) {
	    if (req.headers.host.match(/^www/) !== null ) 
	    	res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url, 301);
	    else 
	    	next();
	});
	
	app.route('/').get(core.flashpage);
	app.route('/m').get(core.index);
	app.route('/sendemail').get(core.sendemail);
	app.route('/activation/:email/:token').get(core.activation);
	app.route('/reset_password/:email/:token').get(core.reset_password);
	app.route('/reset_password').post(core.reset_password_post);
	app.route('/refer_accept/:email/:inviter_id').get(core.refer_accept);
}