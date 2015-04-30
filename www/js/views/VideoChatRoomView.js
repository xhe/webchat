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
        	util.getXirSysCredential(room, function(data){
        		_self.xirSysConfig = data;
        		_self.startVideo(room);
        	});
        },
        
        startVideo: function(room){
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