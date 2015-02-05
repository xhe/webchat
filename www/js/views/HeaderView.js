define(function(require){
	
	var Backbone 		= require('backbone'),
		header_tpl		= require('text!tpl/header.html')
		util = require('common/utils')
		;

    var HeaderView =  Backbone.View.extend( {
    	
    	homeHeader: false,
    	
    	
    	setHomeheader: function(){
    		this.homeHeader = true;
    		return this;
    	},
    	
    	setTitle: function(title){
    		this.title = title;
    		return this;
    	},
    	
    	backDisabled: false,
    	
    	disableBack: function(){
    		this.backDisabled = true;
    		return this;
    	},
    	
    	events:{
         	"click .home": "home",
         	"click #lnkRefresh": "refresh"
         },
         
         refresh: function(){
         	location.reload(); 
         	return false;
         },
         
         home: function(){
        	 $.mobile.navigate("#"); 
         },
         
         back: function(){
        	 if(!this.backDisabled){
        		 window.history.back();
        		 return false;
        	 }
         },
    	
    	render: function(){ 
    		$(this.el).html(_.template( header_tpl, 
    					{ user: util.getLoggedInUser(), 
    						title: this.title, 
    						serverUrl: (window.hostURL?window.hostURL:""),
    						homeHeader: this.homeHeader,
    						platform: window.platform
    						}));
		}
    });
      
   
    return HeaderView;
   
} );