exports.simplifyUser = function(client, noToken){
	client.password = undefined;
	client.password_salt = undefined;
	client.token_date =undefined;
	client.token_expire_date = undefined;
	client.token_date = undefined;
	if(noToken)
		client.token = undefined;
	return client;
}