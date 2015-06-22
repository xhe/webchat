function onNotification(e) {
	switch( e.event )
    {
    	case 'registered':
			if ( e.regid.length > 0 )
			{
				var url = window.hostURL+'/api/android_register'
					$.post( url, { regId: e.regid, type: window.platform })
					  .done(function( data ) {
					    console.log( "Data Loaded: " + data );
					  });
			}
        break;
        
    }
}

function onNotificationAPN (event) {
    if ( event.alert )
    {
        navigator.notification.alert(event.alert);
    }

    if ( event.sound )
    {
        var snd = new Media(event.sound);
        snd.play();
    }

    if ( event.badge )
    {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
}

define(function(require){
	
	var appConfig = require('common/app-config');
	var User = require('models/userModel');
	var dict = require('common/dict');
	
	var util = {
		
		
					Android: function() {
				        return navigator.userAgent.match(/Android/i);
				    },
				    BlackBerry: function() {
				        return navigator.userAgent.match(/BlackBerry/i);
				    },
				    iOS: function() {
				        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
				    },
				    Opera: function() {
				        return navigator.userAgent.match(/Opera Mini/i);
				    },
				    Windows: function() {
				        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
				    },
				    any: function() {
				        return (Android() || BlackBerry() || iOS() || Opera() || Windows());
				    },
				    
		linkify: function(content, mobile){
			var exp = /(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)([-A-Z0-9+&@#%?\/=~_|!:,.;]*)[-A-Z0-9+&@#\/%=~_|])/ig;
			return content.replace(exp, "<a class='hreItemLinkTarget' data-link='$1' >shared link</a>");
		},		    
				    
		isUserLoggedIn: function(){
			if(window.user){
				if( window.user && window.user.loggedIn){
						return true;
				}else{
						return false;
				}
			}else if(localStorage.user){
				window.user = JSON.parse(localStorage.user);
				window.user.logginIn = true;
				return true;
			}else{
				window.user = new User.User();
				return false;
			}	
		},	
		updateLoggedUser : function(user){
			window.user = user;
			window.user.loggedIn = true;
			window.user.thumbFileName=user.thumbFileName;
			delete user.photos
			$.cookie('token', JSON.stringify(user));
			//update localStorage for displaying language
			localStorage.language = user.settings_language;
		},
		
		setLoggedInUser: function(user, getRegId){
			window.user = user;
			window.user.loggedIn = true;
			window.user.thumbFileName=user.thumbFileName;
			delete user.photos
			$.cookie('token', JSON.stringify(user));
			
			//now let's set into  localStorage for mobile app user
			localStorage.user = JSON.stringify(user);
			localStorage.language = user.settings_language;
		
			//set socket here
			window.socketEventService.connect(user.screenName);
			
			if (window.platform && getRegId!=undefined && getRegId==true){
				this.retrieveRegId();
			}
		},
		
		retrieveRegId: function(){
			
			var pushNotification = window.plugins.pushNotification;
			if(window.platform === 'android'){
				pushNotification.register(
										successHandler,
										errorHandler, 
										{
											"senderID": appConfig.gcm_sender_id,
											"ecb": "onNotification"
										}
								);	
			}else if(window.platform === 'ios'){
				pushNotification.register(
					    tokenHandler,
					    errorHandler,
					    {
					        "badge":"true",
					        "sound":"true",
					        "alert":"true",
					        "ecb":"onNotificationAPN"
					    });
			}
			
			function tokenHandler (result) {
			    // Your iOS push server needs to know the token before it can push to this device
			    // here is where you might want to send it the token for later use.
			    var url = window.hostURL+'/api/ios_register'
			    $.post( url, { regId: result, type: 'ios' })
				  .done(function( data ) {
				    console.log( "Data Loaded: " + data );
				  });
			    
			    
			}
			function successHandler (result) {
               console.log("success: " + result);
            }
            function errorHandler (error) {
            	console.log('error:'+ error );
            }
		},
		
		getLoggedInUser: function(){
			return window.user;
		},
		
		logout: function(){
			window.socketEventService.logout();
			window.user = new User.User();
			$.removeCookie('token');
			localStorage.removeItem('user');
			
			return false;
		},
		
		autoLogin: function(cb){
			var _this=this;
			if($.cookie('token') || window.user || localStorage.user){
				var user = window.user;
				if(!user){
					if(localStorage.user){
						user = $.parseJSON( localStorage.user);
					}else{
						user = $.parseJSON($.cookie('token') );
					}
				}
				$.post( appConfig.serverUrl + 'autologin', 
						{ screenName: user.screenName, token: user.token },
						function(data){ 
							if(data.status=='success'){
								if(data.hasOwnProperty('user') ){
									_this.setLoggedInUser(data.user);
								}else{
									_this.setLoggedInUser(user);
								}
							}else{
								_this.logout();
							}
							if(cb){
								cb();
							}	
						});
			}else{
				cb();
			}
		},
		
		showBusy: function(){ 
			if(window.noshowbusy){
				window.noshowbusy=false;
			}else
			$.mobile.loading( 'show', {
				text: 'Loading...',
				textVisible: true,
				theme: 'a',
				html: ""
			});
		},	
		
		hideBudy: function(){
			var interval = setInterval(function () {
	            $.mobile.loading('hide');
	            clearInterval(interval);
	        }, 500);
		},	
		
		getAPIUrl: function(methodName){
			return appConfig.serverUrl + methodName;
		},
			
		detectAndShowError: function(data){
			
			//var atributes =  data.model.models[0].attributes;
			var status = "success";
			
			if(data.status != undefined){
				status = data.status;
			}
			
			if(status == "failed"){
				var page = new ErrorPageView({model: data});
				app.showDialog(page);
				return false;
			}
			return true;
		},
		
		detectServerStatus: function(){
			$.ajax({url: window.hostURL?  window.hostURL:"/",
			        type: "HEAD",
			        timeout:5000,
			        statusCode: {
			            400: function (response) {
			                util.alert('Server is not reachable, please try later.');
			            },
			            0: function (response) {
			            	util.alert('Server is not reachable, please try later.');
			            }              
			        }
				});
		},
		
	
		
		//used to save static url request
		urlRequstCache: [],
		urlRequest_callback: null,
		urlRequest_url: null,
		//this method is used for retrieving remotely, caching and saving to localDB
		ajax_get: function(url,callback,forceUrlRequest){
			if(forceUrlRequest == null){
				forceUrlRequest = false;
			}
	
			if(forceUrlRequest){
				this.urlRequest_callback = callback;
				this.urlRequest_url = url;
				this.ajax_get_loading();
			}else{
				if(this.urlRequstCache[url]==null || this.urlRequstCache[url]==undefined ){
					this.urlRequest_callback = callback;
					this.urlRequest_url = url;
					this.ajax_get_loading();			
				}else{
					this.hideBudy();
					callback (this.urlRequstCache[url]);
					return;
				}		
			}	
		},	
		
		ajax_get_loading: function(){
			if(util.urlRequest_url.indexOf('/accumulated_info')===-1)
				this.showBusy();
			$.ajax({
					  url: util.urlRequest_url,
					  success: 
						  function(data){
							util.hideBudy();
							 if(util.detectAndShowError(data)){
								 util.urlRequstCache[util.urlRequest_url] = data;
								 util.urlRequest_callback (data);
							 }
						},
					  dataType: "json",
					  timeout:5000,
					  statusCode: {
				            400: function (response) {
				                util.alert('Server is not reachable, please try later.');
				            },
				            0: function (response) {
				            	util.alert('Server is not reachable, please try later.');
				            }              
				        },
					  async: false,
			});
		},	
		
		isEmail:    function(s){
			var isEmail_re       = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
			return String(s).search (isEmail_re) != -1;
		},	
		
		isURL: function(url){
			if( (url.indexOf("http://")!==-1 || url.indexOf("https://")!==-1)
					&& url.indexOf(".")>7
				){
				return true;
			} else {
				return false;
			}
		},
		
		
		extractDigits: function(str){
			return str.replace(/\D+/g,'')
		},
		
		
		formatMoney : function(number, decPlaces, thouSeparator, decSeparator) {
		    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
		    decSeparator = decSeparator == undefined ? "." : decSeparator,
		    thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
		    sign = number < 0 ? "-" : "",
		    i = parseInt(number = Math.abs(+number || 0).toFixed(decPlaces)) + "",
		    j = (j = i.length) > 3 ? j % 3 : 0;
		    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
		},
		
		detectMobileDevice: function(){
			var userAgent = navigator.userAgent.toLowerCase();
			if(userAgent.indexOf("iphone")!=-1 || userAgent.indexOf("ipod")!=-1 || userAgent.indexOf("ipad")!=-1){
				return "ios";
			}else if(userAgent.indexOf("android")!=-1){
				return "android";
			}else if(userAgent.indexOf("rim tablet")!=-1){
				return "blackberry";
			}else{
				return "";
			}
		},
		
		convertToHostPath: function(path){
			return (window.hostURL?window.hostURL:"") +path;
		},
		
		retrieveThumbNailPath: function(user, dimention){
			if(!user)
				return "";
			 var photos = user.photos;
			 if(!photos)
				 return "";
			 for(var i=0; i<photos.length; i++)
    			if(photos[i].use_as_head)
    				for(var j=0;j<photos[i].renders.length;j++)
    					if(photos[i].renders[j].dimension==dimention){
    						fileName = photos[i].renders[j].filename;
    						return  (window.hostURL?window.hostURL:"")+ '/uploads/thumb/' + fileName;
    					}
			 
			//now, let's fetch largest one
			var largeDim = 0;
			//var path=(window.hostURL?window.hostURL:"")+ '/img/nobody_32.png';
			var path='';
			for(var i=photos.length-1;i>=0;i--){
				if(photos[i].use_as_head)
					for(var j=0;j<photos[i].renders.length;j++)
						if(photos[i].renders[j].dimension>largeDim){
							fileName = photos[i].renders[j].filename;
							path = (window.hostURL?window.hostURL:"")+ '/uploads/thumb/' + fileName;
							largeDim = photos[i].renders[j].dimension;
						}
			}
			return path;		
		},
		
		showMemberHeadImg: function(member){
			if( member.headImg ){
				if( member.isOnline ){
					 return '<img src="'+ member.headImg +'" style="border:#008000 5px solid"/>';
				}else{
					 return '<img src="'+ member.headImg +'" style="border:#cccccc 5px solid"/>';
				}
			}else{
				if( member.isOnline ){
					 return '<span style="border:#008000 5px solid; padding:5px">' + member.screenName+'</div>';
				}else{
					 return '<span style="border:#cccccc 5px solid; padding:5px">' + member.screenName+'</div>';
				}
			}	
		},
		
		showMemberHeadImgForChatRoom: function(members){
			
			var output = "";
			var height = width = 0;
			var height_n = width_n=0;
			var fn = 20;
			switch(members.length){
				case 1:
					width=height=50;
					width_n=height_n=50;
					fn = 45;
					break;
				case 2:
					width=25;
					height=50;
					width_n=25;
					height_n=50;
					fn=30;
					break;
				default:
					width=height=25;
					width_n=height_n=23;
					fn = 20;
			}
			
			_.each(members, function(member){
				if( member.headImg ){
					if( member.isOnline ){
						output+= "<div style='float: left; height:"+height+"px; width:"+width+"px'><img src='"+ member.headImg +"' width="+width+"px height=" + height + "px></div>";
					}else{
						output+= "<div style='float: left; height:"+height+"px; width:"+width+"px'><img src='"+ member.headImg +"' width="+width+"px height=" + height + "px></div>";
					}
				}else{
					if( member.isOnline ){
						output+= "<div style='float: left; text-align: center; font-size: "+fn+"px; width: "+width_n+"px; height:"+height_n+"px; border: 1px #cccccc solid'>"+ member.screenName.substr(0,1).toUpperCase() +"</div>";
					}else{
						output+= "<div style='float: left; text-align: center; font-size: "+fn+"px; width: "+width_n+"px; height: "+height_n+"px; border: 1px #cccccc solid'>"+ member.screenName.substr(0,1).toUpperCase() +"</div>";
					}
				}
			});
			return output;
		},
		
		
		retrieveMsgThumbNailPath: function(renders, dimention){
			for(var j=0;j<renders.length;j++)
     					if(renders[j].dimension==dimention){
     						fileName = renders[j].filename;
     						return  (window.hostURL?window.hostURL:"")+ '/uploads/thumb/' + fileName;
     					}
			//now, let's fetch largest one
			var largeDim = 0;
			var path="";
			for(var j=renders.length-1;j>=0;j--){
				if(renders[j].dimension>largeDim){
					fileName = renders[j].filename;
					path = (window.hostURL?window.hostURL:"")+ '/uploads/thumb/' + fileName;
					largeDim = renders[j].dimension;
				}
			}
			return path;		
		},
		
		retrieveHighlightThumbNailPath: function(photo, dimention){
			
			var renders = photo.renders;
			for(var j=0;j<renders.length;j++)
     					if(renders[j].dimension==dimention){
     						fileName = renders[j].filename;
     						return  (window.hostURL?window.hostURL:"")+ '/uploads/thumb_highlight/' + fileName;
     					}
			//now, let's fetch largest one
			var largeDim = 0;
			var path="";
			for(var j=renders.length-1;j>=0;j--){
				if(renders[j].dimension>largeDim){
					fileName = renders[j].filename;
					path = (window.hostURL?window.hostURL:"")+ '/uploads/thumb_highlight/' + fileName;
					largeDim = renders[j].dimension;
				}
			}
			return path;		
		},
		
		alert: function(msg, title){
			if(window.platform){
				navigator.notification.alert(msg, function(){}, title?title:null, "Ok");
			}else{
				alert(msg);
			}	
		},
		
		beep: function(times){
			if(window.platform){
				navigator.notification.beep(times);
			}
		},
		
		vibrate: function(ms){ 
			if(window.platform){
				navigator.notification.vibrate(ms?ms:500);
			}
			
			if( !this.getLoggedInUser().settings_disable_sounds )
				document.getElementById('audioBeep').play();
		},
		
		getXirSysCredential: function(room, cb){
			$.get(appConfig.serverUrl+ 'get_xirsys/'+room, function(data){
				cb(data);
			})
		},
		
		generateUUID: function(){
		    var d = new Date().getTime();
		    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		        var r = (d + Math.random()*16)%16 | 0;
		        d = Math.floor(d/16);
		        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		    });
		    return uuid;
		},
		
		datecompare: function(date1, date2){
			var dt1 = new Date(date1.substr(0,4), date1.substr(5,2), date1.substr(8,2),  date1.substr(11,2), date1.substr(14,2), date1.substr(17,2));
			var dt2 = new Date(date2.substr(0,4), date2.substr(5,2), date2.substr(8,2),  date2.substr(11,2), date2.substr(14,2), date2.substr(17,2));
			return dt1.getTime()>dt2.getTime();
		},
		
		getText: function(term, language){
			if( language=='en'){
				return term;
			} else if(dict[term]){
				return dict[term][language];
			} else {
				return term;
			}	
		},
		
		translate: function(term){
			return  util.getText(term, util.getCurrentLanguage());
		},
		
		getCurrentLanguage: function(){
			var language = null;
			if( util.getLoggedInUser() && util.getLoggedInUser().settings_language){
				language = util.getLoggedInUser().settings_language;
			}
			return  localStorage.language || language  || 'en';
		}
		
	};

	return util;
});
