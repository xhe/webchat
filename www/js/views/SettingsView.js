define(function(require){
	
	var Backbone 		= require('backbone'),
		settings_tpl		= require('text!tpl/settings.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		User = require('models/userModel')
		;
		

	// Extends Backbone.View
    var SettingsView = Backbone.View.extend( {
    	
    	self: null,
    	
        // The View Constructor
        initialize: function() {
        	 this.template = _.template( settings_tpl );
        	 self=this;
        },
        events:{
        	"slidestop #selKeepChattingRecord": "selKeepChattingRecord",
        	"slidestop #txtDaysRecordAlive": "updateSettings",
        	"slidestop #txtDaysMediaAlive": "updateSettings",
        	"slidestop #selSilentNotification": "updateSettings",
        	"change #radDisplayLanguage-En":"updateSettingsLan",
        	"change #radDisplayLanguage-Zh":"updateSettingsLan",
        	"slidestop #selDisableNotification": "updateSettingsLan",
        		
        },
        
        selKeepChattingRecord: function(){
        	$("#divChatRecordDays").slideToggle('slow');
        	$("#divChatMediaDays").slideToggle('slow');
        	this.updateSettings();
        },
        
        refreshpage: false,
        updateSettingsLan: function(){
        	self.refreshpage = true;
        	self.updateSettings();
        },
        
        updateSettings: function(){
        	userCollection = new User.UserCollection();
       	 	var language = $('input[name=radDisplayLanguage]:checked').val(); 
       	 	if (language=="" || language ==null)
       	 		language = 'en';
       	 	
        	userCollection.updateSettings(
       	 			$("#selKeepChattingRecord").val()=='on'?true:false,
       	 			$("#txtDaysRecordAlive").val(),
       	 			$("#txtDaysMediaAlive").val(),
       	 			$("#selSilentNotification").val()=='on'?true:false,
       	 			language,
       	 			$("#selDisableNotification").val()=='on'?true:false,
       	 			function(result){
       	 				
       	 				if(self.refreshpage)
       	 					location.reload();
       	 				else
       	 					{
		       	 				util.getLoggedInUser().settings_disable_sounds = result.user.settings_disable_sounds;
		       	 				util.getLoggedInUser().settings_media_days = result.user.settings_media_days;
		       	 				util.getLoggedInUser().settings_records_days = result.user.settings_records_days;
		       	 				util.getLoggedInUser().settings_records_forever = result.user.settings_records_forever;
		       	 				util.getLoggedInUser().settings_language = result.user.settings_language;
		       	 				util.getLoggedInUser().settings_notificatin_disabled = result.user.settings_notificatin_disabled;
		       	 				util.updateLoggedUser( util.getLoggedInUser() );
       	 					}
       	 				
       	 			}
       	 	);
        },
        
        render: function() { 
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(util.translate("Settings")).render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            
            return this;
        }
    } );
    
    
    
    return SettingsView;
   
} );