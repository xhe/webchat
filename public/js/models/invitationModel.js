define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	Invitation = Backbone.Model.extend({
		urlRoot: config.serverUrl + 'invitations',
	});
	
	InvitationCollection = Backbone.Collection.extend({
		model: Invitation,
		url: config.serverUrl + 'invitations',
		
		
		getMyPendingInvitations: function(){
			_self = this;
			util.ajax_get(config.serverUrl+'received_pending_invitations', this.callback, true);
		},
		
		callback: function(data){
			_self.result = data;
			_self.reset();
		}
	});
	
	return {
		Invitation: Invitation,
		InvitationCollection: InvitationCollection
		   }
});