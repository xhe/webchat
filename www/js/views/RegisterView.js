define(function(require){
	
	var Backbone 		= require('backbone'),
		register_tpl		= require('text!tpl/register.html'),
		appConfig = require('common/app-config'),
		CountryCollection = require('models/countryModel'),
		util = require('common/utils'),
		User = require('models/userModel'),
		FooterView = require('views/FooterView')
		;
		

	// Extends Backbone.View
    var RegisterView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( register_tpl );
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
        		$("#passwordAgain").parent().prev().html("Password does not match other.");
        	}else{
            	var user = new User.User({
            				countryCode: util.extractDigits($("#selCountryCode").val()),
    		        		phoneNumber: util.extractDigits($("#phoneNumber").val()),
    		        		firstName:  $("#firstName").val(),
    		        		lastName: $("#lastName").val(),
    		        		screenName: $("#screenName").val(),
    		        		email: $("#email").val(),
    		        		password:  $("#password").val()
            	});
            	
            	if( $("#phoneNumber").val().replace(/\D+/g,'').length==0 ||  isNaN(  $("#phoneNumber").val().replace(/\D+/g,'') )){
            		$("#phoneNumber").parent().prev().html("plese enter valid phone number");
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
	            							$("#divErrorGeneral").html("Error" +": " + errStr);
	            							
	            							if(response.suggestedName){
	            								$("#divSuggestedName").html("Suggested name: " + response.suggestedName);
	            							}
	            							
	            						}else if(response.errors.errors){
	            							_.each(response.errors.errors, function(value, key){
		            							$("#"+key).parent().prev().html(value.message);
		            						});
	            						}else{
	            							$("#"+response.errors.path).parent().prev().html(response.errors.message);
	            						}
	            					}else{
            							alert("You have succcessfully created an account with us, please proceed to your home page to start using our service.");
            							util.setLoggedInUser( response.user );
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
            $(this.el).html(this.template({ countries: this.countries }));
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new CountryListView({model: new CountryCollection.CountryCollection()});
            return this;
        }
    } );
      
   
    var CountryListView =   Backbone.View.extend({
  	  
 	   initialize:function () {
   	        this.model.bind("reset", this.render, this);
	   	    this.model.fetch();
   	   },
   	   
   	  render:function () {
     	  $("#selCountryCode").empty(); 
    	  _.each( this.model.models[0].attributes, function(val, key){
     		  $("#selCountryCode").append("<option value='"+val+"'><a>"+ key+"</a></option>");
     	  });
     	  
    	  $("#selCountryCode").selectedIndex = 0;
     	  $("#selCountryCode").selectmenu("refresh");
     	  
     	  return this;
 	    }  	   
    });
    
    return RegisterView;
   
} );