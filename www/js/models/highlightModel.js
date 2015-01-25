define(function (require) {
	var Backbone 		= require('backbone');
	var config = require('common/app-config');
	var util = 	 require('common/utils');
	
	Highlight = Backbone.Model.extend({
		
		urlRoot: config.serverUrl + 'highlight',
		
		content: null,
		medias: [],
		shared: 0,
		id: null,
		
		isEmpty: function(){
			return this.content==null && this.medias.length==0;
		},
		
		setShared: function(s){
			this.shared = s;
		},
		
		setContent: function(s){
			this.content = s;
		},
		addMedia: function(media, noTrigger){
			this.medias.push(media);
			
			if(noTrigger){
			}else{
				this.trigger('updated');
			}	
		},
		
		getMedias: function(){
			return this.medias;
		},
		
		reset: function(){
			this.content = null;
			this.medias = [];
		},
		
		restoreContents: function(h){
			if(h.content!=null)
				this.setContent( h.content);
			if(h.medias.length>0)
				this.medias = h.medias;
			this.shared = h.shared;
		},
		
		remove: function(uuid){
			for(var i=0; i<this.medias.length; i++){
				if(this.medias[i].uuid === uuid ){
					this.medias.splice( i, 1 );
					break;
				}
			}
			this.trigger('updated');
		},
		
		valid: function(){
			if(this.content.length==0 && this.medias.length ==0 ){
				return false;
			}else{
				return true;
			}
		},
		
		delete: function( cb ){
			
			$.ajax({
			    url: config.serverUrl+'highlight/'+this.id,
			    type: 'DELETE',
			    success: function(result) {
			        // Do something with the result
			    	if( result.status=='failed') {
			    		util.alert ( result.err );
			    	} else {
			    		cb();
			    	}
			    }
			});
			
		},
		
		prepare: function(){
			 var formData = new FormData();
			 formData.append('content', this.content);
			 formData.append('shared', this.shared);
			 formData.append('id', this.id);
			 var media_index = 0;
			 _.each(this.medias, function(media){
					 if(media.type==='photo'){
						 if(media.id){
							 formData.append('original_photos', media.id);
						 }else{
							 formData.append('photos', media.file, util.getLoggedInUser()._id+"_"+ media_index++ +"_"+ media.file.name);
						 }
					 }
					 if(media.type==='audio'){
						 if(media.id){
							 formData.append('original_audios', media.id);
						 }else{
							 formData.append('audios', media.data, util.getLoggedInUser()._id+"_"+media_index++ +"_"+ media.fileName);
						 }
					 }
			 });
			 return  formData ;
		},
		
		saveData: function(cb){
			
			if(  window.platform ){
				var _self = this;
				var original_photos = [];
				var original_audios = [];
				var new_medias = [];
				
				 _.each(this.medias, function(media){
					 if(media.type==='photo')
						 if(media.id)
							 original_photos.push( media.id );
						 else
							 new_medias.push( media );
				
					 if(media.type==='audio')
						 if(media.id)
							 original_audios.push( media.id );
						 else
							 new_medias.push(media);
				 });
				
				
				if(this.id){
					$.post( config.serverUrl+'updateHighlight/'+this.id,
							{
								content: this.content,
								shared: this.shared,
								original_photos: original_photos,
								original_audios: original_audios
							},
							function(result){
								if(result.status=='success'){
									var _id = result.content._id;
								   
									var uploadFile = function( media, media_index ){
										
										 var options = new FileUploadOptions();
								         options.fileKey = media.type +'s';
								         if(media.type=='photo'){
								        	 options.fileName = util.getLoggedInUser()._id+"_"+media_index+"_"+ media.fileName +".JPG";
								        	 options.mimeType = "image/jpg";
								         }else{
								        	 options.fileName = util.getLoggedInUser()._id+"_"+media_index+"_"+ media.fileName;
								         }
								         options.httpMethod = 'POST';
								         
								         var params = new Object();
								         params.imageURI = media.path;
								         options.params = params;
								         options.chunkedMode = false;
								         
								         var win=function(r) {
								        	    console.log("Code = " + r.responseCode);
								        	    console.log("Response = " + r.response);
								        	    console.log("Sent = " + r.bytesSent);
								        	};
								         
								         var ft = new FileTransfer();
										 ft.upload(media.path, window.hostURL + '/api/highlights/'+_id, 
										         	win, 
										         	function(){
															util.alert('An error occurred!');
										         	}, 
										         	options, true);
								   };
									
									
								   var media_index = 0;	
								   window.medias = new_medias;
								   var t = setInterval(function(){
									   var m = window.medias.pop();
									   if(m)
										   uploadFile(m, media_index++);
									   else {
										   clearInterval(t);
										   cb();
									   }   
								   }, 1000);
								   
								}else{
									util.alert('An error occurred!');
								}
								
								
							}
						);
					//update
				}else{
					//create new one
					$.post( config.serverUrl+'highlights', 
							{
								content: this.content,
								shared: this.shared
							},
							function(result){
								if(result.status=='success'){
									var _id = result.content._id;
								   
									var uploadFile = function( media, upload_index ){
										
										 var options = new FileUploadOptions();
								         options.fileKey = media.type +'s';
								         if(media.type=='photo'){
								        	 options.fileName = util.getLoggedInUser()._id+"_"+upload_index+"_"+ media.fileName +".JPG";
								        	 options.mimeType = "image/jpg";
								         }else{
								        	 options.fileName = util.getLoggedInUser()._id+"_"+upload_index+"_"+ media.fileName;
								         }
								         options.httpMethod = 'POST';
								         
								         var params = new Object();
								         params.imageURI = media.path;
								         options.params = params;
								         options.chunkedMode = false;
								         
								         var win=function(r) {
								        	    console.log("Code = " + r.responseCode);
								        	    console.log("Response = " + r.response);
								        	    console.log("Sent = " + r.bytesSent);
								        	};
								         var ft = new FileTransfer();
										 ft.upload(media.path, window.hostURL + '/api/highlights/'+_id, 
										         	win, 
										         	function(){
															util.alert('An error occurred!');
										         	}, 
										         	options, true);
								   };
									
								   var upload_index=0;
									
								   window.medias = _self.medias;
								   var t = setInterval(function(){
									   var m = window.medias.pop();
									   if(m)
										   uploadFile(m, upload_index++);
									   else {
										   clearInterval(t);
										   cb();
									   }   
								   }, 1000);
								   
								}else{
									util.alert('An error occurred!');
								}
							}
					);
				}
				
			} else {
				var xhr = new XMLHttpRequest();
				xhr.open('POST',  (window.hostURL?window.hostURL:'') + '/api/highlights', true);
				
				xhr.onload = function (data) {
					if (xhr.status !== 200) {
		        		  util.alert('An error occurred!');
		        	}else{
		        		if(JSON.parse(xhr.response).status=='failed'){
		        			util.alert(JSON.parse(xhr.response).err);
		        		} else {
		        			//util.alert("Successfully updated");
		        			cb();
		        		}
		        	}
				};
				xhr.send( this.prepare() );
			}
		},
		
		toString: function(){
			var arr= {
					content: this.content,
					medias: this.medias,
					shared: this.shared
			}
			return JSON.stringify( arr );
		},
		
		retrieveById: function(id, cb){
			var _this = this;
			util.ajax_get(config.serverUrl+'highlight/'+id, 
					function(data){
						if(data.status=='success'){
							_this.shared = data.content.shared;
							_this.content = data.content.contents;
							_this.id = data.content._id;
							
							_this.medias = [];
							_.each(data.content.photos, function(photo){
								_this.medias.push(
										{
											id: photo._id,
											uuid: util.generateUUID(),
					    					type: 'photo',
					    					path: util.retrieveHighlightThumbNailPath(photo, 250),
					    					file: null
										}		
									);
							});
							
							_.each(data.content.audios, function(audio){
								_this.medias.push(
									{
										id: audio._id,
										uuid: util.generateUUID(),
				    					type: 'audio',
				    					path: util.convertToHostPath(audio.filename),
				    					data: null,
				    					fileName: audio.filename
									}		
								);
							});
							
							cb(_this);
						}
					}, 
					true);
		}
	});
	
	HighlightCollection = Backbone.Collection.extend({
		model: Highlight,
		url: config.serverUrl + 'highlights',
		_self: null,
		highlights: null,
		
		name: null,
		period_from: null,
		period_to: null,
		
		fetchHighlights: function(name, period_from, period_to){
			_self = this;
			this.name = name?name:util.getLoggedInUser().screenName;
			this.period_from = period_from?period_from:null;
			this.period_to = period_to?period_to:null;
			
			util.ajax_get(config.serverUrl+'highlights/'+this.name+"/"+this.period_from+"/"+this.period_to, 
					this.callback, 
					true);
		},
		
		fetchPrev: function(cb){
			
			if(this.result.contents.length>0){
				_self = this;
				var oldestedTime = this.result.contents[ this.result.contents.length-1 ].created;
				util.ajax_get(config.serverUrl+'highlights/'+this.name +"/"+this.period_from+"/"+this.period_to +'/'+oldestedTime, 
				function(data){
					_self.result = data;
					cb(data);
				}, 
				true);
			}
		},
		
		callback: function(data){
			_self.result = data;
			_self.reset();
		},
		
		getHighlightPhotos: function(id, size){
			var highlight = _.find( this.result.contents, function(highlight){
				return highlight._id==id;
			});
			
			var results = [];
			_.each( highlight.photos, function(photo){
				var result = _.find( photo.renders, function(render){
					return render.dimention==size;
				})
				results.push( result || photo.renders[ photo.renders.length-1]) ;
			});
			return results;
		},
	});
	
	return {
		Highlight: Highlight,
		HighlightCollection: HighlightCollection
		   }
});