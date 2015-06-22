   window.setUrl = function(url){
	    	 alert(url);
	    	//this.uri = uri; 
	     };
	     

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
        	"click .hrefShowType": "changeShowType",
        	"click #btnPhotos": "uploadPhoto",
        	"click #btnCamera": "capturePhoto",
        	"change #file-select": "fileSelected",
        	"click #select-profile-photo": "selectProfilePhoto",
        	"click #upload-button":"upload"
        },
        
        selectProfilePhoto: function(){
        	$("#file-select").click();
        	$("#upload-button").show();
        },
        
	     // A button will call this function
	     // To capture photo
	     capturePhoto: function() {
	    	 window.open('photoUploader.html#type=camera&host='+window.hostURL);
	     },
	      
	     uploadPhoto: function() { 
	    	 window.open('photoUploader.html#type=picture&host='+window.hostURL);
	     },
	     
	     fileSelected: function(event){
	    	  var file = event.target.files[0];
	    	 	// Only process image files.
	    	  if (!file.type.match('image.*')) {
	    	        alert("Please select image only");
	    	  }else{
	    		    var reader = new FileReader();
			    	      // Closure to capture the file information.
			    	  reader.onload =  function(e) {
			    		  $("#selectedImg").attr("src",  e.target.result);
			    		  $("#selectedImg").show();
			    	  };
			    	  reader.readAsDataURL(file);  
	    	  }
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
        	
        	
        	var form = document.getElementById('file-form');
        	var fileSelect = document.getElementById('file-select');
        	var uploadButton = document.getElementById('upload-button');
        	var files = fileSelect.files;
        	// Create a new FormData object.
        	var formData = new FormData();
        	
        	var count=0;
        	for(var i=0; i<files.length; i++){
        		var file = files[i];
        		if(!file.type.match('image.*'))
        			continue;        		
        		formData.append('photo', file, file.name);
        		count++;
        	}
        	if(count==0){
        		util.alert("Please select image first and then upload");
        	}else{
        		$("#upload-button").html("uploading");
            	
        		var xhr = new XMLHttpRequest();
	        	xhr.open('POST', '/api/upload_profile_file', true);
	        	// Set up a handler for when the request finishes.
	        	_this=this;
	        	xhr.onload = function () {
	        	  if (xhr.status === 200) {
	        	    // File(s) uploaded.
	        		  $("#upload-button").html('Upload');
	        		  $("#selectedImg").hide();
	        		  $("#file-select").val("");
	        		  _this.photoCollection.fetch({reset: true});
	        		  $("#upload-button").hide();
	        	  } else {
	        		  util.alert('An error occurred!');
	        	  }
	        	};
	        	// Send the Data.
	        	xhr.send(formData);
        	}
        },
        
        render: function() {           
            $(this.el).html(this.template({ user: util.getLoggedInUser(), mobile: window.platform?true:false }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle( util.translate("My Photos")).render();
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
			window.location = "#photo/"+this.selectedPhotoIds[0];
		},
		
		deleteSelectedImages: function(){
			if(confirm("Are you sure to delelet the photos?")){
				this.model.removePhotos(this.selectedPhotoIds);
			}
				
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
    		if(this.model.models.length>0){
    			this.selectedPhotoIds = [ this.model.models[0].get('_id') ]
    		}
    	}
    	
    });
    
    return PhotosView;
   
} );