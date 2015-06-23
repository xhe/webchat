define(function(require){
	
	var Backbone 		= require('backbone'),
		register_tpl		= require('text!tpl/register.html'),
		appConfig = require('common/app-config'),
		CountryCollection = require('models/countryModel'),
		util = require('common/utils'),
		User = require('models/userModel'),
		FooterView = require('views/FooterView'),
		HeaderView = require('views/HeaderView')
		;
		

	// Extends Backbone.View
    var RegisterView = Backbone.View.extend( {
    	
    	user: null,
    	userCollection: null,
        refer_id: null,
        
        // The View Constructor
        initialize: function(refer_id) {
        	 this.template = _.template( register_tpl );
        	 if(util.isUserLoggedIn())
        		 this.user = util.getLoggedInUser();
        	 if(refer_id)
        	 {
        		 this.refer_id = refer_id
        		 userCollection = new User.UserCollection();
	        	 userCollection.fetchReferer( refer_id, function(data){
	        		 $("#firstName").val(data.firstName);
	        		 $("#lastName").val(data.lastName);
	        		 $("#email").val(data.email);
	        	 });
        	 }
        },
        
        events:{
        	"change #selCountryCode": "selCountry",
        	"click #btnRegister": "register"
        },
        
        selCountry: function(){
        	$("#lblCountryCode").html("+" + $("#selCountryCode").val());
        },
        
        register: function(){
        	$("#divRegisterPageBody .error").empty();
        	$("#divErrorGeneral").empty();
        	$("#divSuggestedName").empty();
        	
			if($("#password").val()!== $("#passwordAgain").val()){
        		$("#passwordAgain").parent().prev().html(util.translate("Password does not match other"));
        	}else{
            	
            	if(this.user){
            		var user = new User.User({
        				countryCode: util.extractDigits($("#selCountryCode").val()),
		        		phoneNumber: util.extractDigits($("#phoneNumber").val()),
		        		firstName:  $("#firstName").val(),
		        		lastName: $("#lastName").val(),
		        		screenName: $("#screenName").val(),
		        		email: $("#email").val(),
		        		password:  $("#password").val(),
		        		userId: this.user._id,
		        		refer_id: this.refer_id,
		        		settings_language: localStorage.language ||""
            		});
            	}else{
            		var user = new User.User({
        				countryCode: util.extractDigits($("#selCountryCode").val()),
		        		phoneNumber: util.extractDigits($("#phoneNumber").val()),
		        		firstName:  $("#firstName").val(),
		        		lastName: $("#lastName").val(),
		        		screenName: $("#screenName").val(),
		        		email: $("#email").val(),
		        		password:  $("#password").val(),
		        		refer_id: this.refer_id,
		        		settings_language: localStorage.language ||""
            		});
            	}
            	
            	if( $("#phoneNumber").val().replace(/\D+/g,'').length==0 ||  isNaN(  $("#phoneNumber").val().replace(/\D+/g,'') )){
            		$("#phoneNumber").parent().prev().html(util.translate("Please enter valid phone number"));
            	}else{
            		user.save(
	            			{},
	            			{
	            				success: function(model, response){
	            					if(response.status=='failed'){
	            						if(response.errors.code){
	            							err=response.errors.err;
	            							pos1 = err.indexOf(":");
	            							pos2= err.indexOf("$", pos1+1);
	            							errStr = err.substr(0, pos1)+": "+err.substr(pos2+1);
	            							
	            							
	            							
	            							var ex=/(.+)\$(.+)_1  dup key: { : "(.+)".+/g
	            							var arr = ex.exec(err);
	            							if(arr.length==4){
	            								var fieldName = arr[2];
	            								var value = arr[3];
	            								errStr = util.translate("%1 (%2) already exist");
	            								errStr = errStr.replace("%1", fieldName).replace("%2", value);
	            							}
	            							
	            							
	            							$("#divErrorGeneral").html(util.translate("Error") +": " + errStr);
	            							
	            							if(response.suggestedName){
	            								$("#divSuggestedName").html(util.translate("Suggested name")+" :" + response.suggestedName);
	            							}
	            							
	            						}else if(response.errors.errors){
	            							_.each(response.errors.errors, function(value, key){
		            							$("#"+key).parent().prev().html(util.translate(value.message));
		            						});
	            						}else{
	            							$("#"+response.errors.path).parent().prev().html(response.errors.message);
	            						}
	            					}else{
	            						if(response.msg && util.isUserLoggedIn()){
	            							util.alert(response.msg);
	            						}else{
	            							util.alert(window.util.getTranslateWithKey('register_1',window.util.getCurrentLanguage());
		        						}
	            						util.setLoggedInUser( response.user, true );
            		        			$.mobile.navigate("#");
            						}
	            				},
	            				error: function(model, resp, opt){
	            				   console.log('error ' + resp);
	            				}
	            			}
	            	);
            	}
            	
            	
        	}
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: this.user, mode: this.refer_id?"refer":"register" }));
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle( this.refer_id? util.translate( "Accept Invitation" ) :( this.user?util.translate('Profile Update'):util.translate('Register') ) ).render();
            new CountryListView({model: new CountryCollection.CountryCollection()});
            return this;
        }
    } );
      
   
    var CountryListView =   Backbone.View.extend({
  	  
       user: null,
    	
 	   initialize:function () {
   	        this.model.bind("reset", this.render, this);
	   	    this.model.fetch();
	   	    if(util.isUserLoggedIn())
	   	    	this.user = util.getLoggedInUser();
   	   },
   	   
   	  render:function () {
     	  $("#selCountryCode").empty(); 
     	  _.each( this.model.models[0].attributes, function(val, key){
     		  var selected = this.user?( val==this.user.countryCode?'selected':'') :"";
     		  $("#selCountryCode").append("<option value='"+val+"' "+selected+" ><a>"+ key+"</a></option>");
     	  });
     	  
    	  $("#selCountryCode").selectedIndex = 0;
     	  $("#selCountryCode").selectmenu("refresh");
     	  
     	  return this;
 	    }  	   
    });
    
    return RegisterView;
   
} );