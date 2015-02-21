define(function(require){
	
	var Backbone 		= require('backbone'),
		photo_tpl		= require('text!tpl/large_photo.html');
		

	// Extends Backbone.View
    var LargePhotoView = Backbone.View.extend( {
        // The View Constructor
        initialize: function(imgPath) {
        	this.imgPath = imgPath;
        	this.template = _.template( photo_tpl );
        },
       
        events:{
        	"click .bigImageOuter": "back"
        },
        
        back: function(){
        	window.noshowbusy=true;
        	window.history.back()
        },
        
        render: function() { 
        	$(this.el).html(this.template({ imgPath: this.imgPath }) );
            return this;
        }
    });
  
    return LargePhotoView;
   
} );