({
    baseUrl: ".",
    paths: {
        jquery: "libs/jquery",
        jquerymobile: "libs/jquery.mobile-1.4.3.min",
        backbone: "libs/backbone",
        text:    "libs/text",
        "jquery.cookie": "libs/jquery.cookie",
        underscore: "libs/underscore",
    },
    
    shim: {
        "backbone": {
              "deps": [ "underscore", "jquery" ],
              "exports": "Backbone"  //attaches "Backbone" to the window object
        },
        "jquery.cookie":{
        	 "deps": [ "jquery" ],
             "exports": "jquery.cookie"  //attaches "Backbone" to the window object
        }
    	}, // end Shim Configuration

    
    name: "mobile",
    out: "main.js"
})