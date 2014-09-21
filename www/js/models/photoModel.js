define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var utils = require('common/utils');
	
	Photo = Backbone.Model.extend({
		
		urlRoot: config.serverUrl + 'myphotos',
		updatePhotoContent: function(photoId, title, description){
			var _this = this;
			$.post( config.serverUrl+'update_photo', 
					{
						photoId: photoId,
						title: title,
						description: description
					},
					function(result){
						utils.alert("Photo detail has been updated.");
					}
			);
		}
		
	});
	
	PhotoCollection = Backbone.Collection.extend({
		model: Photo,
		url: config.serverUrl + 'myphotos',
		
		updateDefault: function(photoId){
			var _this = this;
			$.post( config.serverUrl+'update_default', 
					{
						photoId: photoId
					},
					function(result){
						utils.alert("Default Head image updated")
						_this.fetch({reset: true});
					}
			);
		},
		
		removePhotos: function(photoIds){
			var _this = this;
			$.ajax({
			    url: config.serverUrl+'myphotos', 
			    data:
			    	{
						photoIds: photoIds
					},
			    type: 'DELETE',
			    success: function(result) {
			    	utils.alert("Selected images have been removed successfully.")
					_this.fetch({reset: true});
			    }
			});
		},
		
	});
	
	currentCollection= null ;
	
	findPhotoModel  = function(id, collection){
		if(!collection)
			return null;
		for(var i=0; i<collection.length;i++){
			if(collection[i].get("_id") == id ){
				return collection[i];
			}
		}
		return null;
	};
	
	return {
				Photo: Photo,
				PhotoCollection: PhotoCollection,
				currentCollection: currentCollection,
				findPhotoModel: findPhotoModel
		   }

});