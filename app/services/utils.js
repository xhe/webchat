var http = require('http'), https = require('https');
var config = require('../../config/config');
var request = require("request");

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