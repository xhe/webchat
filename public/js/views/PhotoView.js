define(function(require){
	
	var Backbone 		= require('backbone'),
		photos_tpl		= require('text!tpl/photos.html'),
		photos_list_tpl = require('text!tpl/photos_list.html'),
		util = require('common/utils'),
		Photo			= require('models/photoModel')
		;
		

	// Extends Backbone.View
    var PhotoView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( photos_tpl );
        	 this.photoCollection = new Photo.PhotoCollection();
        },
        events:{
        	"submit #file-form": "upload",
        },
        
        upload: function(event){
        	event.preventDefault();
        	$("#upload-button").html("uploading");
        	
        	
        	var form = document.getElementById('file-form');
        	var fileSelect = document.getElementById('file-select');
        	var uploadButton = document.getElementById('upload-button');
        	var files = fileSelect.files;
        	// Create a new FormData object.
        	var formData = new FormData();
        	
        	for(var i=0; i<files.length; i++){
        		var file = files[i];
        		if(!file.type.match('image.*'))
        			continue;        		
        		formData.append('photo', file, file.name);
        	}
        	var xhr = new XMLHttpRequest();
        	xhr.open('POST', '/api/upload_profile_file', true);
        	// Set up a handler for when the request finishes.
        	_this=this;
        	xhr.onload = function () {
        	  if (xhr.status === 200) {
        	    // File(s) uploaded.
        		  $("#upload-button").html('Upload');
        		  _this.photoCollection.fetch({reset: true});
        	  } else {
        	    alert('An error occurred!');
        	  }
        	};
        	// Send the Data.
        	xhr.send(formData);
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            this.photoListView = new PhotoListView({ el: $("#divPhotoList", this.el), model: this.photoCollection });
            this.photoCollection.fetch({reset: true});
            return this;
        }
    } );
    
    var PhotoListView =  Backbone.View.extend( {
    
    	initialize:function () {
			this.model.bind("reset", this.render, this);
			this.render();
		},
		
		selectedPhotoIds: [],
		
		events: {
			"click .tabProfileImageItem": "clickProfileImageItem",
			"click #btnDeleteSelectedImages": "deleteSelectedImages",
			"click #btnChangeHeaderImage": "changeHeaderImage",
		},
		
		deleteSelectedImages: function(){
			if(confirm("Are you sure to delelet the photos?"))
			this.model.removePhotos(this.selectedPhotoIds);
		},
		
		changeHeaderImage: function(){
			this.model.updateDefault(this.selectedPhotoIds[0]);
		},
		
		clickProfileImageItem: function(event){
			
			var photoIds = [];
			var _self = this;
			$(event.currentTarget).toggleClass('profileImageItemSelected');
			$('.profileImageItemSelected').each(function(i, obj) {
				photoIds.push( obj.getAttribute("data-photoid"));
			});
			
			if(photoIds.length>0){
				$('#btnDeleteSelectedImages').show();
			}else{
				$('#btnDeleteSelectedImages').hide();
			}
			
			var showChangeHead = true;
			if(photoIds.length>0){
				if(photoIds.length==1){
					for(var i=0; i<this.model.models.length;i++){
						if(this.model.models[i].get('use_as_head') && this.model.models[i].get('_id')==photoIds[0]){
							showChangeHead=false;
						}
					}
				}else{
					showChangeHead=false;
				}
			}else{
				showChangeHead=false;
			}
			
			if(showChangeHead){
				$("#btnChangeHeaderImage").show();
			}else{
				$("#btnChangeHeaderImage").hide();
			}
			_self.selectedPhotoIds = photoIds;
		},
	
    	render: function(){
    		$(this.el).html(_.template( photos_list_tpl, { 'results': this.model.models }));
		}
    	
    	
    });
    
    
    return PhotoView;
   
} );