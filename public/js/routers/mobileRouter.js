define(function(require){
	
	var Backbone = require('backbone'),
		HomeView = require('views/HomeView'),
		LoginView		= require('views/LoginView'),
		RegisterView		= require('views/RegisterView'),	
		PhotosView = require('views/PhotosView'),	
		PhotoView = require('views/PhotoView'),
		util = require('common/utils')
		;
    // Extends Backbone.Router
	return Backbone.Router.extend( {

        // The Router constructor
        initialize: function() {
        	 Backbone.history.start();
        },

        // Backbone.js Routes
        routes: {
        	 // When there is no hash bang on the url, the home method is called
            "": "home",
            "logout":"logout",
            "register":"register",
            "photos":"photos",
            "photo/:id":"photo"
        },
        
        login: function(){
        	if(util.isUserLoggedIn()){
        		return false;
        	}else{  
        		loginView = new LoginView();
        		this.changePage(loginView );
        		return true;
        	}
        },
        
        register: function(){
        	registerView = new RegisterView();
        	this.changePage(registerView);
        	return true;
        },
        
        logout: function(){
        	util.logout();
        	router.navigate('#'+Math.random());
        	router.navigate('#', {trigger:true});
        },
        
        photos: function(){
        	if (this.login())
        		return;
        	
        	photosView = new PhotosView();
        	this.changePage(photosView);
        },
        // Home method
        home: function() {
        	if (this.login())
        		return;
        	
        	homeView = new HomeView();
        	this.changePage(homeView);
        },
        
        photo: function(id){
        	if (this.login())
        		return;
        	
        	photoView = new PhotoView();
        	photoView.setPhotoId(id);
        	this.changePage(photoView);
        },
        
        changePage: function (page) {
          $(page.el).attr('data-role', 'page');
          page.render();
          $('body').append($(page.el));
          $.mobile.changePage($(page.el), {
            changeHash: false,
            reverse: false, 
            transition: this.historyCount++ ? 'flip' : 'none',
          });
        },
    } );
} );