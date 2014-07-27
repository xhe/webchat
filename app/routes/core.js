var core = require('../controllers/core')
module.exports = function(app){
	app.route('/').get(core.index);
}