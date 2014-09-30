define(function(require){
	
	var appConfig = require('common/app-config');
	var User = require('models/userModel');

	var util = {
			
		isUserLoggedIn: function(){
			if(window.user){
				if( window.user && window.user.loggedIn){
						return true;
				}else{
						return false;
				}
			}else if(sessionStorage.user){
				window.user = JSON.parse(sessionStorage.user);
				window.user.logginIn = true;
				return true;
			}else{
				window.user = new User.User();
				return false;
			}	
		},	
		setLoggedInUser: function(user){
			window.user = user;
			window.user.loggedIn = true;
			window.user.thumbFileName=user.thumbFileName;
			delete user.photos
			$.cookie('token', JSON.stringify(user));
			
			//now let's set into  sessionStorage for mobile app user
			if( window.platform ){
				sessionStorage.user = JSON.stringify(user);
			}
			//set socket here
			window.socketEventService.connect(user.screenName);
		},
		
		getLoggedInUser: function(){
			return window.user;
		},
		
		logout: function(){
			window.socketEventService.logout();
			window.user = new User.User();
			$.removeCookie('token');
			if( window.platform ){
				sessionStorage.removeItem('user');
			}
			return false;
		},
		
		autoLogin: function(cb){
			var _this=this;
			if($.cookie('token') || window.user || sessionStorage.user){
				var user = window.user;
				if(!user){
					if(sessionStorage.user){
						user = $.parseJSON( sessionStorage.user);
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
							if(cb)
								cb();
						});
			}else{
				cb();
			}
		},
		
		showBusy: function(){ 
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
					  async: false,
			});
		},	
		
		isEmail:    function(s){
			var isEmail_re       = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
			return String(s).search (isEmail_re) != -1;
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
		
		retrieveThumbNailPath: function(user, dimention){
			 var photos = user.photos;
			 for(var i=0; i<photos.length; i++)
     			if(photos[i].use_as_head)
     				for(var j=0;j<photos[i].renders.length;j++)
     					if(photos[i].renders[j].dimension==dimention){
     						fileName = photos[i].renders[j].filename;
     						return  (window.hostURL?window.hostURL:"")+ '/uploads/thumb/' + fileName;
     					}
     		return "";		
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
		
		vibrate: function(ms){ console.log('vibrate ')
			if(window.platform){
				navigator.notification.vibrate(ms?ms:500);
			}
		}
		
	};

	return util;
});
