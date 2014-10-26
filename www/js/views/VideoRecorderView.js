define(function(require){
	
	var Backbone 		= require('backbone'),
		videorecorder_tpl		= require('text!tpl/videoRecorder.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		

	// Extends Backbone.View
    var VideoRecorderView = Backbone.View.extend( {

    	currentBrowser: null,
        fileName: null,
        
        initialize: function(room) {
        	window.videoRecordChatRoom = room;
        	this.template = _.template( videorecorder_tpl );
        	
        	// global variables
            this.currentBrowser = !!navigator.mozGetUserMedia ? 'gecko' : 'chromium';
            
         	// Firefox can record both audio/video in single webm container
            // Don't need to create multiple instances of the RecordRTC for Firefox
            // You can even use below property to force recording only audio blob on chrome
            // var isRecordOnlyAudio = true;
            window.twoInOne = !!navigator.mozGetUserMedia;
           // window.isRecordOnlyAudio = false;
        
        },
        
              
        captureUserMedia: function(success_callback){
        	var session={
        			  audio: true,
                      video: true
        	};
        	if(window.platform==undefined){
        		navigator.getUserMedia =  (navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia);
        		if (navigator.getUserMedia){
        			navigator.getUserMedia(session, success_callback, function(error) {
    	                console.log( JSON.stringify(error) );
    	            });
        		}else{
        			util.alert("This function is only available in chrome or firefox browser. Please open our website using one of these browsers.")
            	}
        	}else{
        		util.alert("This function is only available in chrome or firefox browser. Please open our website using one of these browsers.")
    		}
        	
        	
        
        },
        
        events: {
        	"click #btn-start-recording": "startRecording",
        	"click #btn-stop-recording": "stopRecording"
        },
        
        startRecording: function(){
        	$("#btn-start-recording").prop('disabled', true);
        	this.captureUserMedia(function(stream){
        		window.mediaStream = stream;
        		videoElement = document.querySelector('#vidRecorder');
        		videoElement.src = window.URL.createObjectURL(stream);
                videoElement.play();
                videoElement.muted = true;
                videoElement.controls = false;
                
                if(window.twoInOne){
                	var videoConfig = { type: 'video' };
                    window.videoRecorder = RecordRTC(stream, videoConfig);
                    window.videoRecorder.startRecording();
                }else{
                	var audioConfig = {};
                    audioConfig.onAudioProcessStarted = function() {
                        // invoke video recorder in this callback
                        // to get maximum sync
                        window.videoRecorder.startRecording();
                    };
                	window.audioRecorder = RecordRTC(stream, audioConfig);
                	// it is second parameter of the RecordRTC
                    var videoConfig = { type: 'video' };
                    window.videoRecorder = RecordRTC(stream, videoConfig);
                    window.audioRecorder.startRecording();
                }
                $("#btn-stop-recording").prop('disabled', false);
        	});
        },
        
        stopRecording: function(){
        	$("#btn-start-recording").prop('disabled', false);
        	$("#btn-stop-recording").prop('disabled', true);
        	if(window.twoInOne) {
        		window.videoRecorder.stopRecording(function() {
        			postFiles(window.videoRecorder.getBlob());
        		});
        	}else{
        		window.videoRecorder.stopRecording(function() {
            		window.audioRecorder.stopRecording(function() {
            			      postFiles(window.videoRecorder.getBlob(), window.audioRecorder.getBlob());
                    });
                });
        	}
        },
        
        render: function() {           
            $(this.el).html(this.template());
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Video Message").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            return this;
        }
    } );
   
    
    return VideoRecorderView;
   
} );


// this function submits both audio/video or single recorded blob to nodejs server
function postFiles(video, audio){
    // getting unique identifier for the file name
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
	 
	util.showBusy();
	$.ajax({
	    type: 'POST',
	    url: '/api/upload_chat_video_file/'+window.videoRecordChatRoom,
	    data: formData,
	    contentType: false,
	    cache: false,
	    processData: false,
	  }).done(function(){ 
		  $("#recordAudio").removeClass('stop');
		  $("#recordAudio").addClass('recordAudio');
		  util.hideBudy();
		  alert("Video message has been uploaded successfully.");
		  window.history.back();
	  });
	 
	if(window.mediaStream){
    	window.mediaStream.stop();
    }
}

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
