define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	Contact = Backbone.Model.extend({
		urlRoot: config.serverUrl + 'contacts'
	});
	
	ContactCollection = Backbone.Collection.extend({
		model: Contact,
		url: config.serverUrl + 'contacts',
		
		get_contacts: function(){
			
			_self = this;
			util.ajax_get(config.serverUrl+'contacts', this.callback, true);
		},
		
		callback: function(data){
			window.myContacts = data;
			_self.result = data;
			_self.reset();
		},
		
	});
	
	return {
		Contact: Contact,
		ContactCollection: ContactCollection,
		   }
});