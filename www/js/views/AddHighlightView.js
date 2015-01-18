define(function(require){
	
	var Backbone 		= require('backbone'),
		add_highlights_tpl		= require('text!tpl/addhighlights.html'),
		highlight_media_tpl		= require('text!tpl/highlight_media_list.html'),
		highlight_selection_shared_tpl = require('text!tpl/highlight_shared_selection.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		HighlightModel = require('models/highlightModel')
		;
	

	// Extends Backbone.View
    var AddHighlightsView = Backbone.View.extend( {
    	
    	highlightId: null,
    	
        initialize: function(id) {
        	
        	this.template = _.template( add_highlights_tpl );
        	_this = this;
        	this.highlight = new HighlightModel.Highlight();
        	this.highlight.reset();
        	
        	if(id){
        		this.highlightId = id;
        	}
        },
        
        events: {
        	"click #upload-button-chat-h": "selectFile",
        	"click #recordAudio-h":"recordAudio",
        	"change #file-select-highlight": "fileSelected",
        	"click .divRmvHighlightMedia": "rmvHighlightMedia",
        	"click #btnSave": "save",
        	"click #btnAttPhotos-h": "attPhotos",
        	"click #btnAttCamera-h": "attCamera",
        	"click #recordAudioMobile-h": "recordAudioMobile",
        	"click #btnRemove": "remove"
        },
        
        remove: function(){
        	if(confirm("Are you sure you want to remove this Highlight?")){
        		this.highlight.delete(function(){
        			util.alert("Successfully Removed the selected highlight.");
        			window.history.back();
        		});
        	}
        },
        
        recordAudioMobile: function(){
        	this.highlight.setShared( $('input[name=radSharedWith]:checked').val() );
        	this.highlight.setContent($("#txtHightContent").val());
        	if(!this.highlight.isEmpty())
        		sessionStorage.setItem('highlight', this.highlight.toString() );
        	window.open('mediaUploader.html#type=audio&host='+window.hostURL+"&roomId=0");
        },
        
        attPhotos: function(){
        	this.highlight.setShared( $('input[name=radSharedWith]:checked').val() );
        	this.highlight.setContent($("#txtHightContent").val());
        	if(!this.highlight.isEmpty()){
        		console.log("saving session ");
        		console.log( this.highlight.toString() )
        		sessionStorage.setItem('highlight', this.highlight.toString() );
        	}
        		
        	
        	window.open('photoUploader.html#type=picture&host='+window.hostURL+"&roomId=0");
        },
        attCamera: function(){
        	this.highlight.setShared( $('input[name=radSharedWith]:checked').val() );
        	this.highlight.setContent($("#txtHightContent").val());
        	if(!this.highlight.isEmpty())
        		sessionStorage.setItem('highlight', this.highlight.toString() );
        	window.open('photoUploader.html#type=camera&host='+window.hostURL+"&roomId=0");
        },
        
        save: function(){
        	this.highlight.setShared( $('input[name=radSharedWith]:checked').val() );
        	this.highlight.setContent($("#txtHightContent").val());
        	if(! this.highlight.valid() ){
        		util.alert("Please enter content or select media first.");
        	} else {
        		window.unsavedHighlight = this.highlight;
        		window.history.back();
        		//this.highlight.saveData();
        		
        	}
        },
        
        recordRTC: null,
        recording: false,
        recordAudio: function(){
        	self = this;
        	if(!this.recording){
        		navigator.getUserMedia =  (navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia);
        		if (navigator.getUserMedia /* && window.platform==undefined*/) {
    				
    				navigator.getUserMedia (
    						 {
    					         video: false,
    					         audio: true
    					      },
    					      function(mediaStream){
    					    	  $("#recordAudio-h").removeClass('recordAudio');
    					    	  $("#recordAudio-h").addClass('stop');
    					    	  self.recording = true;
    					    	  recordRTC = RecordRTC(mediaStream);
    					    	  recordRTC.startRecording();
    					      },
    					      function(err) {
    					         console.log("The following error occured: " + err);
    					      }
    						);
    			} else {
    				console.log("getUserMedia not supported");
    				util.alert("This audio function is only available in chrome or firefox web browser, not in safari. Please open our website using one of these browsers.")
    			}
        	}else{
        		this.recording = false;
        		_self=this;
        		recordRTC.stopRecording(function(audioURL) { 
        			  var data =  recordRTC.getBlob();
        			  var type = data['type'].split('/')[1];
        			  var fileName = new Date().getTime()+"_"+ (Math.floor(Math.random() * 100) + 1) +"."+type;
        			  _self.highlight.addMedia(
			    				{
			    					uuid: util.generateUUID(),
			    					type: 'audio',
			    					path: audioURL,
			    					data: data,
			    					fileName: fileName
			    				}
			    		);
        			  $("#recordAudio-h").addClass('recordAudio');
			    	  $("#recordAudio-h").removeClass('stop');
        		});
        	}
        },
        
        rmvHighlightMedia: function(event){
        	if(confirm("Are you sure you want to remove the media?"))
        		this.highlight.remove(event.target.getAttribute('data-uuid'));
        },
        
        selectFile: function(){
        	$("#file-select-highlight").click();
        },
        
        fileSelected: function(event){
        	  var _this= this;
	    	  var file = event.target.files[0];
	    	 	// Only process image files.
	    	  if (!file.type.match('image.*')) {
	    	        alert("Please select image only");
	    	  }else{
	    		    var reader = new FileReader();
			    	      // Closure to capture the file information.
			    	  reader.onload =  function(e) {
			    		  _this.highlight.addMedia(
			    				{
			    					uuid: util.generateUUID(),
			    					type: 'photo',
			    					path: e.target.result,
			    					file: document.getElementById('file-select-highlight').files[0]
			    				}
			    		);
			    	  };
			    	  reader.readAsDataURL(file);  
	    	  }
	     },
        
        render: function() {           
            $(this.el).html(this.template({ mobile: window.platform?true:false, edit: this.highlightId?true:false }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Add Highlight").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            this.mediaListView = new mediaListView({ el: $("#divSelectedMedias", this.el), model: this.highlight });
            
            if(this.highlightId){
            	var _this = this;
            	this.highlight.retrieveById( this.highlightId, function(doc){
        			_this.highlight = doc;
        			_this.checkSession(_this.highlight);
        			_this.refreshStaticContent( doc );
        		});
            }else{
            	this.checkSession(this.highlight);
            }
            return this;
        },
        
        refreshStaticContent: function(highlight){
        	(function(doc){
				setTimeout(function(){
    				$("#txtHightContent").val( doc.content );
    				$("#radSharedWith-family").attr("checked", false);
    				$("#radSharedWith-friend").attr("checked", false);
    				$("#radSharedWith-all").attr("checked", false);
    				$("#radSharedWith-none").attr("checked", false);
    				
    				switch(doc.shared){
    				    case 1:
        				case '1': 
        					$("#radSharedWith-family").attr("checked", true);break;
        				case 2: 
        				case '2': 
        					$("#radSharedWith-friend").attr("checked", true);break;
        				case 3:
        				case '3':
        					$("#radSharedWith-all").attr("checked", true);break;
        				case 0:
        				case '0': 
        					$("#radSharedWith-none").attr("checked", true);break;
    				}
    				$("#radSharedWith-family").checkboxradio( "refresh" );
    				$("#radSharedWith-friend").checkboxradio( "refresh" );
    				$("#radSharedWith-all").checkboxradio( "refresh" );
    				$("#radSharedWith-none").checkboxradio( "refresh" );
				}, 0);
			})(highlight);
        },
        
        checkSession : function(highlight){
        	if(window.platform){
        		
        		if(sessionStorage.getItem('highlight')!=''
        			&& sessionStorage.getItem('highlight')!=null
        			&& sessionStorage.getItem('highlight')!='null'
        			){
        			var tmp = JSON.parse( sessionStorage.getItem('highlight') );
        			sessionStorage.setItem('highlight', '');
            		if(tmp.content!=null || tmp.medias.length>0) {
            			highlight.restoreContents( tmp );
            			this.refreshStaticContent( highlight );
            		}
            	}
        		
        		if( sessionStorage.getItem('filesDataForPhoto')!=''
        			&& sessionStorage.getItem('filesDataForPhoto')!=null
        			&& sessionStorage.getItem('filesDataForPhoto')!='null'){
            		var tmp = JSON.parse ( sessionStorage.getItem('filesDataForPhoto'));
            		sessionStorage.setItem('filesDataForPhoto', '');
            		highlight.addMedia(
    	    				{
    	    					uuid: util.generateUUID(),
    	    					type: 'photo',
    	    					path: tmp.file_loc,
    	    					fileName: tmp.file_name
    	    				}, true
    	    		);
            	}
        		
        		 if( sessionStorage.getItem('filesDataForMedia')!= ""
        			 &&  sessionStorage.getItem('filesDataForMedia')!= null
        			 &&  sessionStorage.getItem('filesDataForMedia')!= 'null'
        		 ) {
        			var filesData = JSON.parse ( sessionStorage.getItem('filesDataForMedia'));
             		sessionStorage.setItem('filesDataForMedia', '');
             		var mediaType = filesData.mediaType;
             		var mediaFiles = filesData.mediaFiles;
             		highlight.addMedia(
    	    				{
    	    					uuid: util.generateUUID(),
    	    					type: 'audio',
    	    					path: mediaFiles[0].fullPath,
    	    					fileName: mediaFiles[0].name
    	    				}, true
    	    		);
        		 }
        	}
        	highlight.trigger('updated');
        }
        
    });
   
    
    
    
    var mediaListView =  Backbone.View.extend( {
    	initialize:function () {
    		var _this=this;
    		this.model.on('updated', function(){
    			_this.render();
	        });
    	},
		
		render: function(){
				$(this.el).html(_.template( highlight_media_tpl, { highlights: this.model.getMedias() } ));
				
		}
    });
    
    return AddHighlightsView;
   
} );


