define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	Invitation = Backbone.Model.extend({
		urlRoot: config.serverUrl + 'invitations'
	});
	
	InvitationCollection = Backbone.Collection.extend({
		model: Invitation,
		url: config.serverUrl + 'invitations',
		
		
		getMyPendingInvitations: function(){
			_self = this;
			util.ajax_get(config.serverUrl+'received_pending_invitations', this.callback, true);
		},
		
		getInvitationById: function(id){
			_self = this;
			util.ajax_get(config.serverUrl+'invitation/'+id, this.callback, true);
		},
		
		callback: function(data){
			_self.result = data;
			_self.reset();
		},
		
		handleInvitation: function(invitation_id, action, msg, is_family){
			var _this = this;
			$.post( config.serverUrl+'invitation', 
					{
						invitation_id: invitation_id,
						action: action,
						msg: msg,
						is_family: is_family
					},
					function(result){
						_this.trigger('action_done');
					}
			);
		}
	});
	
	return {
		Invitation: Invitation,
		InvitationCollection: InvitationCollection
		   }
});