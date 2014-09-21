define(function(require){
	
	var Backbone 		= require('backbone'),
		photos_tpl		= require('text!tpl/photos.html'),
		photos_list_tpl = require('text!tpl/photos_list.html'),
		photos_detail_tpl = require('text!tpl/photos_detail.html'),
		util = require('common/utils'),
		Photo			= require('models/photoModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		

	// Extends Backbone.View
    var PhotosView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( photos_tpl );
        	 this.photoCollection = new Photo.PhotoCollection();
        },
        events:{
        	"submit #file-form": "upload",
        	"click .hrefShowType": "changeShowType"
        },
       
        
        changeShowType: function(event){
        	if( event.target.getAttribute('data-type') == 'grid'){
        		this.photoListView.setTemplate(photos_list_tpl);
        	}else{
        		this.photoListView.setTemplate(photos_detail_tpl);	
        	}
        	this.photoListView.render();
        	
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
        		  util.alert('An error occurred!');
        	  }
        	};
        	// Send the Data.
        	xhr.send(formData);
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser() }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("My Photos").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            this.photoListView = new PhotoListView({ el: $("#divPhotoList", this.el), model: this.photoCollection });
            this.photoCollection.fetch({reset: true});
            return this;
        }
    } );
    
    var PhotoListView =  Backbone.View.extend( {
    	
    	tpl: photos_list_tpl,
    	setTemplate: function(tpl){
    		this.tpl = tpl;
    	},
    	
    	initialize:function () {
			this.model.bind("reset", this.render, this);
			//this.render();
		},
		
		selectedPhotoIds: [],
		
		events: {
			"click .tabProfileImageItem": "clickProfileImageItem",
			"click #btnDeleteSelectedImages": "deleteSelectedImages",
			"click #btnChangeHeaderImage": "changeHeaderImage",
			"click #btnViewHeaderImage": "showPhotoDetail",
		},
		
		showPhotoDetail: function(){
			$.mobile.navigate("#photo/"+this.selectedPhotoIds[0]);
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
			var showBigHead = false;
			if(photoIds.length>0){
				if(photoIds.length==1){
					for(var i=0; i<this.model.models.length;i++){
						if(this.model.models[i].get('use_as_head') && this.model.models[i].get('_id')==photoIds[0]){
							showChangeHead=false;
						}
					}
					showBigHead = true;
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
			
			if(showBigHead){
				$("#btnViewHeaderImage").show();
			}else{
				$("#btnViewHeaderImage").hide();
			}
			
			
			_self.selectedPhotoIds = photoIds;
		},
	
    	render: function(){
    		Photo.currentCollection = this.model.models;
    		$(this.el).html(_.template( this.tpl, { 'results': this.model.models,  serverUrl: (window.hostURL?window.hostURL:"")  }));
		}
    	
    });
    
    return PhotosView;
   
} );