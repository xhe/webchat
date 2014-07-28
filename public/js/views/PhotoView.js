define(function(require){
	
	var Backbone 		= require('backbone'),
		photo_tpl		= require('text!tpl/photo.html'),
		util = require('common/utils'),
		Photo			= require('models/photoModel')
		;
		

	// Extends Backbone.View
    var PhotoView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( photo_tpl );
        },
        
        events: {
        	"click .back": "back",
        	"click #btnPhotoEdit": "editPhotoContent"
        },
        back: function(){
        	window.history.back();
            return false;
        },
        editPhotoContent: function(){
        	var photo = new Photo.Photo();
        	photo.updatePhotoContent( this.photo.get("_id"), $("#photoTitle").val(),  $("#photoDescription").val());
        },
        
        photo: null,
        
        setPhotoId: function(id){
        	this.photo = Photo.findPhotoModel( id, Photo.currentCollection);
        },
        
        render: function() { 
        	if (!this.photo){
        		$.mobile.navigate("#photos");
        	}else{
        		$(this.el).html(this.template({ user: util.getLoggedInUser(), item: this.photo }));
           }
           return this;
        }
    } );
  
    return PhotoView;
   
} );