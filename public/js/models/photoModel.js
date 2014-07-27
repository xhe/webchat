define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	
	Photo = Backbone.Model.extend({
		urlRoot: config.serverUrl + 'myphotos/'
	});
	
	PhotoCollection = Backbone.Collection.extend({
		model: Photo,
		url: config.serverUrl + 'myphotos/',
		
		updateDefault: function(photoId){
			var _this = this;
			$.post( config.serverUrl+'update_default', 
					{
						photoId: photoId
					},
					function(result){
						alert("Default Head image updated")
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
			    	alert("Selected images have been removed successfully.")
					_this.fetch({reset: true});
			    }
			});
		},
		
		
	});
	
	return {
				Photo: Photo,
				PhotoCollection: PhotoCollection
		   }

});