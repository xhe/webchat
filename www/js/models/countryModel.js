define(function (require) {	
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	Country = Backbone.Model.extend({
	});
	CountryCollection = Backbone.Collection.extend({
		url : config.serverUrl+'countries',
		model: Country,
		
	});
	return {
		Country: Country,
		CountryCollection:CountryCollection
	}
	
});