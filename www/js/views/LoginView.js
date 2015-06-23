define(function(require){
	
	var Backbone 		= require('backbone'),
		login_tpl		= require('text!tpl/login.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		FooterView = require('views/FooterView')
		;
		

	// Extends Backbone.View
    var loginView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( login_tpl );
        	 this.render();
        },
        
        events:{
        	"click #btnLogin": "login",
        	"click .divChangeLanguageLink": "toggleLanguage"
        },
        
        toggleLanguage: function(){
        	localStorage.language = util.getCurrentLanguage()=='en'?'zh':'en';
        	router.navigate('#'+Math.random());
	        router.navigate('#', {trigger:true});
        },
        
        login: function(){
        	util.detectServerStatus();
        	var username = $("#userName").val();
        	var password = $("#passWord").val(); 
        	$.post(appConfig.serverUrl + 'login', 
        		  {
        			'userName': username,
        			'passWord': password,
        			'language': localStorage.language?localStorage.language:""
        		  },
        		  function(data){
        			 $("#loginError").hide(); 
        			 if(data.status=='success'){
        				 if(data.msg){
        					 util.alert(data.msg);
        				 }
        				 util.setLoggedInUser( data.user, true );
        				 router.navigate('#'+Math.random());
        		         router.navigate('#', {trigger:true});
        			 }else{
        				 $("#loginError").show(); 
        			 } 
        			 
        		  });
        },
        
        render: function() {           
            $(this.el).html(this.template({ url:window.hostURL?window.hostURL:'',  
            				mobile: window.platform==undefined?false:true,
            				util: util,
            				platform: window.platform
            }));
            //new FooterView({ el: $(".footerContent", this.el)}).render();
            return this;
        }
    } );
      
   
    return loginView;
   
} );