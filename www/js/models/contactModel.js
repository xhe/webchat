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
	
	getContacts = function(level, cb){
		
			util.ajax_get(config.serverUrl+'contacts',
					function(data){
						cb( _.filter(data, function(c){ 
							return level==1?c.is_family==true:c.is_family==false;
						}));
					}, 
					true);
	
	};
	
	return {
		Contact: Contact,
		ContactCollection: ContactCollection,
		getContacts: getContacts
		   }
});