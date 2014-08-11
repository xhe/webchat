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
            "jquery.cookie": "libs/jquery.cookie",
            "socket.io": '/socket.io/socket.io'
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
            }
      } // end Shim Configuration

} );

// Includes File Dependencies
require([ "jquery", "backbone", "routers/mobileRouter", "common/app-config", "common/utils", "socket.io", "jquery.cookie" ],
		function( $, Backbone, Mobile, appConfig, utils, io ) {
	
	Backbone.emulateHTTP = true;
	
	//asssign IO to windows object, and connet will be initiated in utils. setLogginUser
	window.io = new io();
	
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
	
	require( [ "jquerymobile","jquery.cookie" ], function() {
		// Instantiates a new Backbone.js Mobile Router
		utils.autoLogin(function(){
			router = new Mobile();
		});
	});
	
} );


