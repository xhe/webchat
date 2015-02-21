//http://blog.groupbuddies.com/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions
//https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC

//http://www.w3.org/TR/html-media-capture/
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
      
      window.postMediaDataToServer = function(formData, url){
     	 (
  				function(dom){
  					dom.html("Uploading");
  					var xhr = new XMLHttpRequest();
  					xhr.open('POST', url+current_roomId, true);
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
          	        	var resp = JSON.parse(xhr.response);
          	        	dom.parentsUntil('tr')[0].parentNode.querySelector('i').setAttribute('data-msgid', resp._id);
  	        		};
          	        	// Send the Data.
          	        xhr.send(formData);
          	        $("#recordAudio").removeClass('stop');
         			$("#recordAudio").addClass('recordAudio');
         			$("#recordVideo").removeClass('stop');
         			$("#recordVideo").addClass('recordVideo');
  				}
			  )( $('#messages li:last .spanUploadPercentage') );
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
		            			function(msg){ 
			        				//not media upload
        							var msg = JSON.parse(msg);
        							if(util.getLoggedInUser().screenName=== msg.creator.screenName && (msg.video || msg.audio) 
        							  ||
        							  util.getLoggedInUser().screenName=== msg.creator.screenName && window.platform && (msg.video || msg.audio || msg.photo) 
        							){
        								//for video, remove last one here
        								removeSelectedMedia();
        								appendChatMsg( msg);
        							}	
        							else
	        							if( util.getLoggedInUser().screenName!== msg.creator.screenName
	        								||
	        								util.getLoggedInUser().screenName=== msg.creator.screenName
	        								&& !msg.photo && !msg.audio && !msg.video
	        							)
				        					appendChatMsg( msg);
        						}
            		);
        		 
        		  window.socketEventService.on(window.socketEventService.EVENT_TYPE_RESUME_ROOM, function(){
        			  if( window.location.href.indexOf('chatroom/')>0)
        			  _self.chatMessageCollection.fetchNew(function(messages){
        				  	var tmpResults = JSON.parse(JSON.stringify(messages));
        		        	 while(tmpResults.length>0){
        		        		 appendChatMsg(tmpResults.pop());
        		        	 } 
        			  }); 
         		 }); 
         		 
        		  
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
        	//"submit #file-form-chat": "upload",
        	"click #upload-button-chat": "selectFile",
        	"click #recordAudio":"recordAudio",
        	"click .hrefVideoChatRoom": "playVideoChatRoom",
        	"click .hrefAudioChatRoom": "playAudioChatRoom",
        	"click #recordAudioMobile": "recordAudioMobile",
        	"click #recordVideoMobile": "recordVideoMobile",
        	"change #file-select-chat": "fileSelected",
        	"change #file-select-chat-video": "videoFileSelected",
        	"click .btnRemoveMsg": "removeMsg",
        	"click #btnStartUpload": "upload",
        	"click #recordVideo": "recordVideo",
        	"click #hrefShowAttController": "toggleAttController",
        	"click .imgChatItem": "showChatImgBig",
        	"click #divChatImgWrapper":"backToChatList"
        },
        
        backToChatList: function(){
        	$("#divChatImgWrapper").hide("fast",function(){
        		$(".footerContent").show();
        	});
        },
        
        showChatImgBig: function(event){
        	$("#imgChatMsgBig").attr("src",event.target.getAttribute("data-smallimgurl"));
        	$(".footerContent").hide("fast", function(){
		        		$("#divChatImgWrapper").show('slow', function(){ 
		        			$("#imgChatMsgBig").attr("src",event.target.getAttribute("data-bigimgurl"));
		        				});
		    });
       },
        
        toggleAttController: function(){
        	
        	if($("#divAttachController").is(':hidden') ){
        		$("#divAttachController").slideDown();
        		$("#messages").css({top: parseInt( $("#messages").css("top").replace("px", "")) +60 });
        		$("#hrefShowAttController").removeClass("ui-icon-plus").addClass("ui-icon-minus");
        	} else {
        		$("#divAttachController").slideUp();
        		$("#messages").css({top: parseInt( $("#messages").css("top").replace("px", "")) - 60 });
        		$("#hrefShowAttController").removeClass("ui-icon-minus").addClass("ui-icon-plus");
        	}
        	
        },
        
        recordVideo: function(){
        	
        	navigator.getUserMedia =  (navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia);
        		if (navigator.getUserMedia ) {
        			
        			$.mobile.navigate("#videoRecord/"+ current_roomId );
    			
        		} else {
    				
    				if(util.iOS()){
    					$("#file-select-chat-video").click();
    				} else {
    					util.alert("This video function is only available in chrome or firefox web browser, not in safari. Please open our website using one of these browsers.")
        			}
    			
    			}
        },
        
        
        selectFile: function(){
        	$("#file-select-chat").click();
        },
        
        removeMsg: function(event){
        	
        	var parents = $(event.target).parentsUntil('ul');
        	window.removedTarget = parents[ parents.length-1 ];
        	if(confirm("Are you sure you want to remove this chat message?"))
        		  this.chatMessageCollection.removeMsg( event.target.getAttribute('data-msgid'), function(data){
			        		if(data.status=='success'){
			        			window.removedTarget.remove();
			        		}else{
			        			console.log("erro")
			        		}
			        	});
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
    				util.alert("This audio function is only available in chrome or firefox web browser, not in safari. Please open our website using one of these browsers.")
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
        			 
        			  window.postMediaDataToServer(formData, '/api/upload_chat_audio_file/');
        		});
        	}
        },
        
        videoFileSelected: function(){
        	
        	
        	var input = document.querySelector('#file-select-chat-video'); // see Example 4
	        var fileSelect = document.getElementById('file-select-chat-video');
	        var files = fileSelect.files;
	        // Create a new FormData object.
	        var formData = new FormData();
	        var count = 0;
	        for(var i=0; i<files.length; i++){
	        	var file = files[i];
	        	if(!file.type.match('video.*'))
	        		continue;        		
	        	formData.append('video', file, file.name);
	        	count++;
	        }
	        
	        if(count==0){
	        		util.alert("Please select video file.");
	        }else{
	        	 $("#recordVideo").removeClass('recordAudio');
		    	 $("#recordVideo").addClass('stop');
		    	 self.recording = true;
		    	 //now change this flag to false so as to enable next file select
			     window.fileSelectedNonSaved = false;
			     window.postMediaDataToServer(formData, '/api/upload_chat_video_file/');
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
			    		  $("#btnStartUpload").button();
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
        		 window.postMediaDataToServer(formData, '/api/upload_chat_file/');
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
        	
          	$(this.el).html(this.template({ user: util.getLoggedInUser(), roomId: current_roomId,  mobile: window.platform?true:false, mobileOS:window.platform }));
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
    	window.fileSelectedNonSaved = false;
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
    	
    	window.postMediaDataToServer(formData, '/api/upload_chat_video_file/');
    }
    
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
        	 
        	 if( sessionStorage.getItem('filesDataForMedia')
        			 && sessionStorage.getItem('filesDataForMedia')!=null
        			 && sessionStorage.getItem('filesDataForMedia')!='null'
        	 ) {
        		 
        		 var filesData = JSON.parse ( sessionStorage.getItem('filesDataForMedia'));
        		 var mediaType = filesData.mediaType;
        		 var mediaFiles = filesData.mediaFiles;
        		 var roomId = filesData.roomId;
        		 
        		 var fullPath = mediaFiles[0].fullPath;
        		 var fileName = mediaFiles[0].name;
        		 sessionStorage.setItem('filesDataForMedia', null);
        		 
        		 var options = new FileUploadOptions();
		         options.fileKey = mediaType;
		         options.fileName = fileName;
		         options.httpMethod = 'POST';
	
		         var params = new Object();
		         params.imageURI = fullPath;
		         options.params = params;
		         options.chunkedMode = false;
		         var ft = new FileTransfer();
        		 
		         
		        window.fileSelectedNonSaved = false;
		        
		        var audioPath = "";
		        var videoPath = "";
		        if( mediaType==="audio" ){
		        	audioPath = "audio";
		        	videoPath = "";
		        }else{
		        	audioPath = "";
		        	videoPath = "video";
		        }
		        
		     	appendChatMsgTmp({
		  			photoPath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
		  			photoLargePath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
		  			msgPhotoPath: '', 
		  			msgPhotoLargePath: '', 
		  			audioPath: audioPath,
		  			videoPath: videoPath,
		  			user: util.getLoggedInUser(),
		  			mobile: window.platform?true:false
		     	});
		       
		     	(
		     		function(dom){
		     			dom.html("Uploading...");
	  					ft.upload(fullPath, window.hostURL + (mediaType==="audio"? '/api/upload_chat_audio_file/' : '/api/upload_chat_video_file/' )+ roomId , 
					         	function(){
	  								dom.html("Upload Completed.");
					         	}, 
					         	function(){
					         		dom.html("Error uploading.");
					         	}, 
					         	options, true);
			        }
		     	)( $('#messages li:last .spanUploadPercentage') );
        	 }
        	
        	 if( sessionStorage.getItem('filesDataForPhoto')
        		 && sessionStorage.getItem('filesDataForPhoto')!='null'
        		 &&  sessionStorage.getItem('filesDataForPhoto')!=null
        	 ) {
        		 
        		 var filesData = JSON.parse ( sessionStorage.getItem('filesDataForPhoto'));
        		 var file_loc = filesData.file_loc;
        		 var roomId = filesData.roomId;
        		 var file_name = filesData.file_name;
        		 sessionStorage.setItem('filesDataForPhoto', null);
        
        		 var options = new FileUploadOptions();
		         options.fileKey = "photo";
		         var imagefilename =  file_name + ".JPG";
		         options.fileName = imagefilename;
		         options.mimeType = "image/jpg";
		         options.httpMethod = 'POST';
	
		         var params = new Object();
		         params.imageURI = file_loc;
		         options.params = params;
		         options.chunkedMode = false;
		         var ft = new FileTransfer();
	         
		         
		         window.fileSelectedNonSaved = false;
		         
		         appendChatMsgTmp({
			  			photoPath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
			  			photoLargePath:'', // util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
			  			msgPhotoPath: file_loc, 
			  			msgPhotoLargePath: file_loc, 
			  			audioPath: "",
			  			videoPath: "",
			  			user: util.getLoggedInUser(),
			  			mobile: window.platform?true:false
			     });
		       
		     	(	
			     		function(dom){
			     			dom.html("Uploading...");
		  					ft.upload(file_loc, window.hostURL + '/api/upload_chat_file/'+roomId, 
						         	function(){
		  								dom.html("Upload Completed."); 
		  							}, 
						         	function(){
						         		dom.html("Error uploading.");
						         	}, 
						         	options, true);
				       }
			     )( $('#messages li:last .spanUploadPercentage') );
		     	
		     	
        	 }
         }
    });
    
    return RoomChattingView;
   
} );