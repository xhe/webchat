
// Sets the require.js configuration for your application.
require.config( {
	
	  baseUrl: 'js',
	  // 3rd party script alias names (Easier to type "jquery" than "libs/jquery-1.8.2.min")
      paths: {
            // Core Libraries
            "jquery": "libs/jquery",
            "jquerymobile": "libs/jquery.mobile-1.4.3.min",
            "underscore": "libs/underscore",
            "backbone": "libs/backbone",
            "text":    "libs/text",
            "jquery.cookie": "libs/jquery.cookie"
      },
      // Sets the configuration for your third party scripts that are not AMD compatible
      shim: {
            "backbone": {
                  "deps": [ "underscore", "jquery" ],
                  "exports": "Backbone"  //attaches "Backbone" to the window object
            },
            "jquery.cookie":{
            	 "deps": [ "jquery" ],
                 "exports": "jquery.cookie"  //attaches "Backbone" to the window object
            },
            "jquery.endless":{
            	"deps": [ "jquery" ]
            }
      } // end Shim Configuration

} );

// Includes File Dependencies
require([ "jquery", "backbone", "routers/mobileRouter", "common/app-config", "common/utils",  "services/socketEvents", "jquery.cookie"],
		function( $, Backbone, Mobile, appConfig, utils, SocketEventService ) {
	
	Backbone.emulateHTTP = true;

	$( document ).on( "mobileinit",
		// Set up the "mobileinit" handler before requiring jQuery Mobile's module
		function() {
			// Prevents all anchor click handling including the addition of active button state and alternate link bluring.
			$.mobile.linkBindingEnabled = false;
			// Disabling this will prevent jQuery Mobile from handling hash changes
			$.mobile.hashListeningEnabled = false;

			jQuery.support.cors = true;
			jQuery.ajaxSetup({ cache: true });
			
			$('div[data-role="page"]').live('pagehide', function (event, ui) {
			    $(event.currentTarget).remove();
			});
		}
	)
	
	if( window.platform ){
		document.addEventListener("deviceready",function(){ alert ("ready")
			require( [ "jquerymobile","jquery.cookie" ], function() { 
				window.socketEventService = new SocketEventService(  io);
				_.extend( window.socketEventService,  Backbone.Events  );	
				utils.autoLogin(function(){ 
					router = new Mobile();
				});
				//This is an event that fires when a Cordova application is put into the background.
				document.addEventListener("pause", onPause, false);
				function onPause() {
				    // Handle the pause event
					window.socketEventService.logout();
				}
				
				document.addEventListener("resume", onResume, false);
				//This is an event that fires when a Cordova application is retrieved from the background.
				function onResume() {
					setTimeout(function() {
						  // TODO: do your thing!
							//window.socketEventService = new SocketEventService(  io);
							//_.extend( window.socketEventService,  Backbone.Events  );	
							utils.autoLogin(function(){ 
								router = new Mobile();
							});
				        }, 0);
				}
				
				document.addEventListener("offline", onOffline, false);
				function onOffline() {
				    // Handle the offline event
					window.socketEventService.logout();
				}

				document.addEventListener("online", onOnline, false);
				//During initial startup, the first online event (if applicable) will take at least a second to fire. - ios
				function onOnline() {
				    // Handle the online event
					setTimeout(function() {
				          // TODO: do your thing!
							//window.socketEventService = new SocketEventService(  io);
							//_.extend( window.socketEventService,  Backbone.Events  );	
							utils.autoLogin(function(){ 
								router = new Mobile();
							});
				        }, 2000);
				}				
			});
		},false);
	
	}else{
	
		require( [ "jquerymobile","jquery.cookie" ], function() {
			// Instantiates a new Backbone.js Mobile Router
			window.socketEventService = new SocketEventService( io );
			_.extend( window.socketEventService,  Backbone.Events  );	
			utils.autoLogin(function(){
				router = new Mobile();
			});
		});
	
	}
	
});


