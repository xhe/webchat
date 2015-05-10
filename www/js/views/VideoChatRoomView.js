define(function(require){
	
	var Backbone 		= require('backbone'),
		videochat_tpl		= require('text!tpl/videochat.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		

	// Extends Backbone.View
    var VideoChatRoomView = Backbone.View.extend( {

        // The View Constructor
    	xirSysConfig: null,
        initialize: function() {
        	this.template = _.template( videochat_tpl );
        },
        
        setRoom: function(room){
        	var _self = this;
        	this.room = room;
        	this.rtc_switchboard = false;
        	
        	util.getSignallingConfig(room, function(data){
        		
        		if(data.rtc_switchboard){
        			_self.rtc_switchboard = true;
        			_self.rtc_switchboard_url =  data.content;
        		} else {
        			
        			_self.xirSysConfig = data.content;
        		}
        		_self.startVideo(room);
        	});
        	/*
        	util.getXirSysCredential(room, function(data){
        		console.log("inside htere ");
    			console.log( data );
        		_self.xirSysConfig = data;
        		_self.startVideo(room);
        	});*/
        },
        
        startVideo: function(room){
        	
        	if(this.rtc_switchboard){
        		
        		// Set RTC options.
        		var rtcOpts = {
        		    room: this.room,
        		    signaller: this.rtc_switchboard_url
        		};
        			// call RTC module
        			var rtc = RTC(rtcOpts);
        			// A div element to show our local video stream
        			var localVideo = document.getElementById('l-video');
        			// A div element to show our remote video streams
        			var remoteVideo = document.getElementById('r-video');

        			// Display local and remote video streams
        			localVideo.appendChild(rtc.local);
        			remoteVideo.appendChild(rtc.remote);
        		
        	} else {
    
        		var webrtc = new SimpleWebRTC({
            	    // The DOM element that will hold "our" video
            	    localVideoEl: 'localVideo',
            	    // The DOM element that will hold remote videos
            	    remoteVideosEl: 'remotesVideos',
            	    // Immediately ask for camera access
            	    autoRequestMedia: true,
            	    debug: false,
            	    detectSpeakingEvents: true,
            	    autoAdjustMic: false,
            	    // Add the new peerConnectionConfig object
            	    peerConnectionConfig: this.xirSysConfig 
            	});
            	// we have to wait until it's ready
            	webrtc.on('readyToCall', function () {
            	  // you can name it anything
            		console.log("joins " + room)
            	  webrtc.joinRoom(room);
            	});
        	}
        	
        },
        
        render: function() {           
            $(this.el).html(this.template());
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Video Chat").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            return this;
        }
    } );
   
    
    return VideoChatRoomView;
   
} );