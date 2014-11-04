define(function(require){
	var appConfig = {
			serverUrl: (window.hostURL?  window.hostURL:"") + "/api/",
			thumb_dir: "/uploads/thumb/",
			gcm_sender_id: "1056367652783"
	};
	return appConfig;
});