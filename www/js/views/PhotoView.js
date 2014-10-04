define(function(require){
	
	var Backbone 		= require('backbone'),
		photo_tpl		= require('text!tpl/photo.html'),
		util = require('common/utils'),
		Photo			= require('models/photoModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		
		;
		

	// Extends Backbone.View
    var PhotoView = Backbone.View.extend( {

        // The View Constructor
        initialize: function(id) {
        	this.template = _.template( photo_tpl );
        },
        
        events: {
        	"click #btnPhotoEdit": "editPhotoContent"
        },
        
        editPhotoContent: function(){
        	var photo = new Photo.Photo();
        	photo.updatePhotoContent( this.photo.get("_id"), $("#photoTitle").val(),  $("#photoDescription").val());
        },
        
        photo: null,
        
        setPhotoId: function(id){
        	this.photo = Photo.findPhotoModel( id, Photo.currentCollection);
        	this.renderme();
        },
        
        renderme: function() { 
        	if (!this.photo){
        		$.mobile.navigate("#photos");
        	}else{
        		$(this.el).html(this.template({ user: util.getLoggedInUser(), item: this.photo, serverUrl: (window.hostURL?window.hostURL:"")  }));
           }
        	new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Find Friends").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
           
           return this;
        }
    } );
  
    return PhotoView;
   
} );