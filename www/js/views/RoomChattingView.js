//http://blog.groupbuddies.com/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions
//https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC
define(function(require){
	
	var Backbone 		= require('backbone'),
		room_chatting_view_tpl		= require('text!tpl/room_chatting_view.html'),
		room_chatting_item_view_tpl		= require('text!tpl/chatrooms_list_item.html'),
		room_chatting_item_view_tmp_tpl		= require('text!tpl/chatrooms_list_item_tmp.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		ChatMessageModel = require('models/chatMessageModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		
	var chat_message_event_initialized = false;
	var current_roomId = null;
	
	window.fileSelectedNonSaved = false;
	
	var removeSelectedMedia = function(){
		window.fileSelectedNonSaved = false;
		$('#messages li:last').remove();
	}
	
	var appendChatMsgTmp = function(chatData){
		
		if(window.fileSelectedNonSaved){
			//just multiple select, no save yet, we need to remove last one
			$('#messages li:last').remove();
		}else{
			window.fileSelectedNonSaved = true;
		}
		
		if(  $('#messages')[0] ){
				
				 var oldscrollHeight = $('#messages')[0].scrollHeight;
	        	 $('#messages')
    		 	.append( 
		 				$('<li>').html(
		 						 _.template( room_chatting_item_view_tmp_tpl,
		 								 		chatData
		 								  )		
		 				)		
		 			);
	        	 var newscrollHeight = $('#messages')[0].scrollHeight;
	       		 if(newscrollHeight > oldscrollHeight){ //COMPARES
	       		        $("#messages").scrollTop($("#messages")[0].scrollHeight); //Scrolls
	       		  }
			}
	};
	
	var  appendChatMsg = function(chat){
      	if(current_roomId === chat.room ){
      			
      		if(  $('#messages')[0] ){
	      				
	      				 var oldscrollHeight = $('#messages')[0].scrollHeight;
				        	 $('#messages')
			     		 	.append( 
			 		 				$('<li>').html(
			 		 						 _.template( room_chatting_item_view_tpl,
			     		 								  { 
			 		 							 			photoPath: util.retrieveThumbNailPath(chat.creator, 50), 
			 		 							 			photoLargePath: util.retrieveThumbNailPath(chat.creator, 10000), 
			 		 							 			msgPhotoPath: chat.photo? util.retrieveMsgThumbNailPath(chat.photo.renders, 100) : "", 
			 		 							 			msgPhotoLargePath: chat.photo? util.retrieveMsgThumbNailPath(chat.photo.renders, 10000) : "", 
			 		 							 			chat: chat,
			 		 							 			audioPath: (chat.audio && chat.audio.filename)?util.convertToHostPath( chat.audio.filename ):"",
			 		 							 			videoPath: (chat.video && chat.video.filename)?util.convertToHostPath( chat.video.filename ):"",
			 		 							 			user: util.getLoggedInUser(),
			 		 							 			mobile: window.platform?true:false
			     		 								  }
			 		 								  )		
			 		 				)		
			 		 			);
				        	 var newscrollHeight = $('#messages')[0].scrollHeight;
				       		 if(newscrollHeight > oldscrollHeight){ //COMPARES
				       		        $("#messages").scrollTop($("#messages")[0].scrollHeight); //Scrolls
				       		  }
	      			}
			} 
      };
      
	// Extends Backbone.View
    var RoomChattingView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( room_chatting_view_tpl );
        	 this.chatMessageCollection = new ChatMessageModel.ChatMessageCollection();
        	 var _self = this;
        	  if(!chat_message_event_initialized){
        		  window.socketEventService.on( window.socketEventService.EVENT_TYPE_CHATMESSAGE, 
		            			function(msg){ //alert('in room chatting view');
			        				//not media upload
        							var msg = JSON.parse(msg);
        							if(util.getLoggedInUser().screenName=== msg.creator.screenName && msg.video){
        								//for video, remove last one here
        								removeSelectedMedia();
        								appendChatMsg( msg);
        							}	
        							else
	        							if( util.getLoggedInUser().screenName!== msg.creator.screenName
	        								&& ( msg.photo	|| msg.audio || msg.video)
	        								||
	        								util.getLoggedInUser().screenName=== msg.creator.screenName
	        								&& !msg.photo && !msg.audio && !msg.video
	        							)
				        					appendChatMsg( msg);
			        			}
            		);
        		 chat_message_event_initialized = true;
        	  };
        },
        
      
        
        loadMorePrev: function(){
        	this.chatMessageCollection.fetchPrev(function(data){
	 				var tmpResults = JSON.parse(JSON.stringify(data));
	 				if( tmpResults.length==0 )
	 				{
	 					$("#btnMorePrev").hide();
	 				}else{
	 					while(tmpResults.length>0){
	 					 var chat = tmpResults.pop();
	 					 var photoPath = util.retrieveThumbNailPath(chat.creator, 50);
	 					 $('#messages')
	 					 .prepend( 
	        		 				$('<li>').html(_self.template({ 
	        		 					photoPath: util.retrieveThumbNailPath(chat.creator, 50), 
	        		 					chat: chat, 
	        		 					user: util.getLoggedInUser() 	
	        		 				}))
	        		 			);
	 					}
	 				}
       	 })
        },
        
        setRoomId: function(id){
        	current_roomId = id;
        	var _self= this;
        	 setTimeout( function(){ 
        		 _self.footerView.setRoomId(current_roomId);
                 _self.chatMessageCollection.getChatMessages(id);
        	 }, 1 );
        },
       
        events: {
        	"click #btnSubmit": "sendMessage",
        	"click #btnMorePrev": "loadMorePrev",
        	"click #btnAttach": "attachMedia",
        	"click #btnChattingRoomBack_phone": "chatRoomBack", 
        	"click #btnChattingRoomBack_web": "chatRoomBack", 
        	"click #btnAttPhotos": "attPhotos",
        	"click #btnAttCamera": "attCamera",
        	"submit #file-form-chat": "upload",
        	"click #recordAudio":"recordAudio",
        	"click .hrefVideoChatRoom": "playVideoChatRoom",
        	"click .hrefAudioChatRoom": "playAudioChatRoom",
        	"click #recordAudioMobile": "recordAudioMobile",
        	"click #recordVideoMobile": "recordVideoMobile",
        	"change #file-select-chat": "fileSelected"
        },
        
        playVideoChatRoom: function(event){
        	event.preventDefault();
        	var videoUrl = event.currentTarget.getAttribute("data-link");
        	 // Play a video with callbacks
        	var options = {
        	    successCallback: function() {
        	      console.log("Video was closed without error.");
        	    },
        	    errorCallback: function(errMsg) {
        	      console.log("Error! " + errMsg);
        	    }
        	  };
        	  window.plugins.streamingMedia.playVideo(videoUrl, options);
        },
        
        playAudioChatRoom: function(event){
        	event.preventDefault();
        	var audioUrl = event.currentTarget.getAttribute("data-link");
        	//var media = new Media(audioUrl, function(){});
        	//media.play();
        	// Play an audio file with options (all options optional)
        	  var options = {
        	    bgColor: "#FFFFFF",
        	    //bgImage: "<SWEET_BACKGROUND_IMAGE>",
        	    bgImageScale: "fit",
        	    successCallback: function() {
        	    	if(window.platform=='android'){
        	    		window.history.back();
        	    	}
        	    },
        	    errorCallback: function(errMsg) {
        	    	window.history.back();
        	    }
        	  };
        	  window.plugins.streamingMedia.playAudio(audioUrl, options);
        	  
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
    					    	  $("#recordAudio").removeClass('recordAudio');
    					    	  $("#recordAudio").addClass('stop');
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
    				util.alert("This video/audio function is only available in chrome or firefox web browser. Please open our website using one of these browsers.")
    			}
        	}else{
        		this.recording = false;
        		_self=this;
        		recordRTC.stopRecording(function(audioURL) { 
        			  var formData = new FormData();
        			  var data =  recordRTC.getBlob();
        			  var type = data['type'].split('/')[1];
        			  var fileName = new Date().getTime()+"_"+ (Math.floor(Math.random() * 100) + 1) +"."+type;
        			  formData.append('audio', data, fileName); 
        			  
        			  window.fileSelectedNonSaved = false;
        			  appendChatMsgTmp({
				 			photoPath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
				 			photoLargePath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
				 			msgPhotoPath: '', 
				 			msgPhotoLargePath: '', 
				 			audioPath: audioURL,
				 			videoPath: "",
				 			user: util.getLoggedInUser(),
				 			mobile: window.platform?true:false
        			  });
        			 
        			  (
	        				function(dom){
	        					var xhr = new XMLHttpRequest();
	        					xhr.open('POST', '/api/upload_chat_audio_file/'+current_roomId, true);
	        					xhr.onprogress=function(evt) 
	        	        		{
	        	        			   if (evt.lengthComputable) 
	        	        			   {  //evt.loaded the bytes browser receive
	        	        			      //evt.total the total bytes seted by the header
	        	        			     var percentComplete = (evt.loaded / evt.total)*100;  
	        	        			     if( percentComplete==100 ){
	        	        			    	 dom.html("Upload Completed.");
	        	        			    	 $("#ctrAttach").hide();
	        	        			    	 $("#ctrInputMsg").show();
	        	        			     }else{
	        	        			    	 dom.html("Uploaded: "+percentComplete +"%");
	        	        			     }
	        	        			   } 
	        	        		};
	        	        		xhr.onload = function () {
	                	        
	        						if (xhr.status !== 200) {
	                	        		  util.alert('An error occurred!');
	                	        	  }
	                	        	};
	                	        	// Send the Data.
	                	        xhr.send(formData);
	                	        $("#recordAudio").removeClass('stop');
	               				$("#recordAudio").addClass('recordAudio');
	        				}
        			  )( $('#messages li:last .spanUploadPercentage') );
        			});
        	}
        	
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
			    		  
			    		  appendChatMsgTmp({
			    			 
						 			photoPath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
						 			photoLargePath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
						 			msgPhotoPath: e.target.result, 
						 			msgPhotoLargePath: e.target.result, 
						 			audioPath: "",
						 			videoPath: "",
						 			user: util.getLoggedInUser(),
						 			mobile: window.platform?true:false
			    		  });
			    		  
			    	  };
			    	  reader.readAsDataURL(file);  
	    	  }
	     },
  
        upload: function(event){
        	event.preventDefault();
        	//now change this flag to false so as to enable next file select
        	window.fileSelectedNonSaved = false;
        	
        	var form = document.getElementById('file-form-chat');
        	var fileSelect = document.getElementById('file-select-chat');
        	var uploadButton = document.getElementById('upload-button-chat');
        	var files = fileSelect.files;
        	// Create a new FormData object.
        	var formData = new FormData();
        	var count = 0;
        	for(var i=0; i<files.length; i++){
        		var file = files[i];
        		if(!file.type.match('image.*'))
        			continue;        		
        		formData.append('photo', file, file.name);
        		count++;
        	}
        	
        	if(count==0){
        		util.alert("Please select image first.");
        	}else{
        		
        		(
        			function(dom){
        				var xhr = new XMLHttpRequest();
                		xhr.onprogress=function(evt) 
        	        		{
        	        			   if (evt.lengthComputable) 
        	        			   {  //evt.loaded the bytes browser receive
        	        			      //evt.total the total bytes seted by the header
        	        			     var percentComplete = (evt.loaded / evt.total)*100;  
        	        			     if( percentComplete==100 ){
        	        			    	 dom.html("Upload Completed.");
        	        			    	 $("#ctrAttach").hide();
        	        			    	 $("#ctrInputMsg").show();
        	        			     }else{
        	        			    	 dom.html("Uploaded: "+percentComplete +"%");
        	        			     }
        	        			   } 
        	        		};
        	        	
        	        	xhr.open('POST', '/api/upload_chat_file/'+current_roomId, true);
        	        	// Set up a handler for when the request finishes.
        	        	_this=this;
        	        	xhr.onload = function () {
        	        	  if (xhr.status === 200) {
        	        		  $("#file-select-chat").val("");
        	        	  } else {
        	        		  util.alert('An error occurred!');
        	        	  }
        	        	};
        	        	// Send the Data.
        	        	xhr.send(formData);
        			}
        		)( $('#messages li:last .spanUploadPercentage') );
        	
        	}
        },
        
        recordAudioMobile: function(){
         	window.open('mediaUploader.html#type=audio&host='+window.hostURL+"&roomId="+current_roomId);
        },
        
        recordVideoMobile: function(){
         	window.open('mediaUploader.html#type=video&host='+window.hostURL+"&roomId="+current_roomId);
        },
        attPhotos: function(){
        	window.open('photoUploader.html#type=picture&host='+window.hostURL+"&roomId="+current_roomId);
        },
        attCamera: function(){
        	 window.open('photoUploader.html#type=camera&host='+window.hostURL+"&roomId="+current_roomId);
        },
        
        attachMedia: function(){
        	$("#ctrAttach").show();
        	$("#ctrInputMsg").hide();
        },
        
        chatRoomBack:function(){
        	
        	if(window.fileSelectedNonSaved){
        		if(confirm('You have selected media, but not upload yet, please cancel to click button in order to upload. Otherwise, continue to give up your selection.')){
        			removeSelectedMedia();
        			$("#ctrAttach").hide();
            		$("#ctrInputMsg").show();
        		}
        	}else{
        		$("#ctrAttach").hide();
        		$("#ctrInputMsg").show();
        	}
        	
        },
        
        sendMessage: function(){
        	var msg = $('#txtMsg').val();
        	if(msg==""){
        		 util.alert('Please enter message first!');
        	}else{
        		$('#txtMsg').val("")
        		this.chatMessageCollection.addChatMessage(current_roomId, msg, function(chat){});
        	}
        },
        
        render: function() {  
        	
          	$(this.el).html(this.template({ user: util.getLoggedInUser(), roomId: current_roomId,  mobile: window.platform?true:false }));
          	new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Chatting").render();
          	this.footerView = new FooterView({ el: $(".footerContent", this.el)}).render();
          	
            new RoomChattingListView({ model: this.chatMessageCollection});
            return this;
        }
    });
    
    function generateRandomString(){
    	if (window.crypto) {
            var a = window.crypto.getRandomValues(new Uint32Array(3)),
                token = '';
            for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
            return token;
        } else {
            return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
        }
    }
    
    var postVideo = function(video, audio, videoURL){
    	
    	appendChatMsgTmp({
 			photoPath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
 			photoLargePath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
 			msgPhotoPath: '', 
 			msgPhotoLargePath: '', 
 			audioPath: '',
 			videoPath: videoURL,
 			user: util.getLoggedInUser(),
 			mobile: window.platform?true:false
    	});
    	
    	var fileName = generateRandomString();
        var formData = new FormData();
    	if(audio)
    	{
        	var type_audio = audio.type.split('/')[1];
        	var fileName_audio = fileName + '.' + audio.type.split('/')[1];
        	formData.append('audio', audio, fileName_audio); 
    	}
        
    	if(video)
    	{
    		var type_video = video.type.split('/')[1];
    		var fileName_video = fileName + '.' + video.type.split('/')[1];
    		formData.append('video', video, fileName_video);
    	}
    	if(window.mediaStream){
        	window.mediaStream.stop();
        }
    	
    	(
    			function(dom){
    				var xhr = new XMLHttpRequest();
            		xhr.onprogress=function(evt) 
    	        		{
    	        			   if (evt.lengthComputable) 
    	        			   {  //evt.loaded the bytes browser receive
    	        			      //evt.total the total bytes seted by the header
    	        			     var percentComplete = (evt.loaded / evt.total)*100;  
    	        			     if( percentComplete==100 ){
    	        			    	 dom.html("Upload Completed.");
    	        			     }else{
    	        			    	 dom.html("Uploaded: "+percentComplete +"%");
    	        			     }
    	        			   } 
    	        		};
    	        	
    	        	xhr.open('POST', '/api/upload_chat_video_file/'+current_roomId, true);
    	        	// Set up a handler for when the request finishes.
    	        	_this=this;
    	        	xhr.onload = function () {
    	        	  if (xhr.status === 200) {
    	        		  $("#file-select-chat").val("");
    	        	  } else {
    	        		  util.alert('An error occurred!');
    	        	  }
    	        	};
    	        	// Send the Data.
    	        	xhr.send(formData);
    			}
    	)($('#messages li:last .spanUploadPercentage'));
    }
    
    //https://gist.github.com/shiawuen/1534477
    
    var RoomChattingListView =  Backbone.View.extend({
    	 
    	initialize: function() {
         	 this.model.on('reset', this.render);
         },
         
         render: function(){
        	 this.template = _.template( room_chatting_item_view_tpl );
        	 $('#messages').empty();
        	 var tmpResults = JSON.parse(JSON.stringify(this.result));
        	 while(tmpResults.length>0){
        		 appendChatMsg(tmpResults.pop());
        	 } 
        	 
        	 if(window.recordedVideo)
        	 {
        		 postVideo( window.recordedVideo.video, window.recordedVideo.audio, window.recordedVideo.videoURL )
        	 }
        	 window.recordedVideo = null;
         }
    });
    
    return RoomChattingView;
   
} );