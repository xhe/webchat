define(function(require){
	
	var Backbone 		= require('backbone'),
		forgetPassword_tpl		= require('text!tpl/forgetPassword.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		User = require('models/userModel'),
		FooterView = require('views/FooterView'),
		HeaderView = require('views/HeaderView')
		;
		

	// Extends Backbone.View
    var ForgetPasswordView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( forgetPassword_tpl );
        },
        
        events:{
        	"click #btnRetrieve":"retrievePwd"
        },
        
        retrievePwd: function(){
        	if(!util.isEmail( $("#pwdRetrieve_email").val() )){
        		$("#divErrorGeneral").html(util.translate("Please enter valid email address"));
        	}else{
        		$("#divErrorGeneral").html("");
        		
        		var email = $("#pwdRetrieve_email").val();
            	$.post(appConfig.serverUrl + 'resetPasswrod', 
            		  {
            			'email': email
            		  },
            		  function(data){
            			  if(data.status=='success'){
            				  util.alert(util.translate('An password reset email has been sent to your email box, please follow the link to reset your password.')) 
            			  }else{
            				  $("#divErrorGeneral").html( data.err);
            			  }
            		  });
        	}
        },
        
        render: function() {           
            $(this.el).html(this.template());
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(util.translate( 'Password Reminder' ) ).render();
            
            return this;
        }
    } );
      
    
    return ForgetPasswordView;
   
} );