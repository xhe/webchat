define(function(require){
	
	var Backbone 		= require('backbone'),
		settings_tpl		= require('text!tpl/settings.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		User = require('models/userModel')
		;
		

	// Extends Backbone.View
    var SettingsView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( settings_tpl );
        },
        events:{
        	"slidestop #selKeepChattingRecord": "selKeepChattingRecord",
        	"slidestop #txtDaysRecordAlive": "updateSettings",
        	"slidestop #txtDaysMediaAlive": "updateSettings",
        	"slidestop #selSilentNotification": "updateSettings",
        	"change #radDisplayLanguage-En":"updateSettings",
        	"change #radDisplayLanguage-Zh":"updateSettings"
        		
        },
        
        selKeepChattingRecord: function(){
        	$("#divChatRecordDays").slideToggle('slow');
        	$("#divChatMediaDays").slideToggle('slow');
        	this.updateSettings();
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
       	 			function(result){
       	 				util.getLoggedInUser().settings_disable_sounds = result.user.settings_disable_sounds;
       	 				util.getLoggedInUser().settings_media_days = result.user.settings_media_days;
       	 				util.getLoggedInUser().settings_records_days = result.user.settings_records_days;
       	 				util.getLoggedInUser().settings_records_forever = result.user.settings_records_forever;
       	 				util.getLoggedInUser().settings_language = result.user.settings_language;
       	 				util.updateLoggedUser( util.getLoggedInUser() );
       	 			//router.navigate('#settings?'+Math.random());
       		        //router.navigate('#settings', {trigger:true});
       	 				location.reload();
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