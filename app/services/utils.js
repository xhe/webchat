var http = require('http'), https = require('https');
var config = require('../../config/config');
var request = require("request");

exports.generateDateStr = function(dt){
	var date = new Date(dt);
	var t1 = date.getTime()/1000;
	var now = Math.floor(Date.now()/1000);
	var timeDiff = now-t1;
	var months = Math.floor( timeDiff/3600/24/30 );
	var days =   Math.floor( (timeDiff - months*3600*24*30) / 3600 / 24 );
	var hours = Math.floor( (timeDiff - months*3600*24*30 - days*3600*24) / 3600 );
	var minutes = Math.floor((timeDiff - months*3600*24*30 - days*3600*24 - hours*3600)/60);
	
	var dtStr = "";
	if(months>0){
		if( months==1 )
			dtStr = "More than 1 month";
		else
			dtStr = "More than "+months+" months";
	} else if(days>0){
		if( days==1 )
			dtStr = days+" day" ;
		else
			dtStr = days+" days" ;
		if(hours>0)
			if(hours==1)
				dtStr += " 1 hour";
			else
				dtStr += " " +hours +" hours";
		if(minutes>0)
			if(minutes==1)
				dtStr+=" 1 minute";
			else
				dtStr+=" "+minutes+" minutes";
		
	} else if (hours>0){
		if(hours==1)
			dtStr = "1 hour";
		else
			dtStr = hours +" hours";
		if(minutes>0)
			if(minutes==1)
				dtStr+=" 1 minute";
			else
				dtStr+=" "+minutes+" minutes";
	} 
	if( dtStr == ""){
		dtStr = "Just Now";
	} else {
		dtStr +=" ago";
	}
	return dtStr;
}

exports.simplifyUser = function(client, noToken) {
	client.password = undefined;
	client.password_salt = undefined;
	client.token_date = undefined;
	client.token_expire_date = undefined;
	client.token_date = undefined;
	client.email = undefined;
	client.settings_records_forever = undefined;
	client.settings_records_days = undefined;
	client.settings_media_days = undefined;
	client.settings_disable_sounds = undefined;
	client.gcm_registration_id = undefined;
	client.ios_registration_id = undefined;
	client.created = undefined;
	client.activated = undefined;
	client.processed = undefined;
	
	if (noToken)
		client.token = undefined;
	client.phoneNumber = undefined;
	client.countryCode = undefined;

	return client;
}

exports.getXirSysInfo = function(room,cb) {

	var xirsys = config.xirsys;
	request.post('https://api.xirsys.com/getIceServers', {
		form : {
			ident : xirsys.ident,
			secret : xirsys.secret,
			domain : xirsys.domain,
			application : "default",
			room : room,
			secure : 1
		},
		json : true
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			// body.d.iceServers is where the array of ICE servers lives
			iceConfig = body.d.iceServers;
			cb(null, iceConfig);
		}
	});

};

exports.isEmail = function(s){
	if(!s) return false;
	
	var isEmail_re       = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
	return String(s).search (isEmail_re) != -1;
};	