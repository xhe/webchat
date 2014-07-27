define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	
	User = Backbone.Model.extend({
		urlRoot  : config.serverUrl +'users'
	});
	return {
		User: User
	}
	
});