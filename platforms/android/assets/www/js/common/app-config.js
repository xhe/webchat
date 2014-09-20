define(function(require){
	var appConfig = {
			serverUrl: (window.hostURL?  window.hostURL:"") + "/api/",
			thumb_dir: "/uploads/thumb/"
	};
	return appConfig;
});