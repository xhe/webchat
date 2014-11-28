var user_service =  require('../services/user');

exports.index = function(req, res){
	//res.render('index.server.view.html');
	res.redirect('/index.html');
}


exports.reset_password= function(req, res){
	user_service.checkEmailTokenValidity( req.params.email, req.params.token, function(err, user){
		res.render('reset_password', {err: err, user: user});
	});
}

exports.reset_password_post = function(req, res){
	
	user_service.checkEmailTokenValidity( req.body.email, req.body.token, function(err, user){
		if(err){
			res.render('reset_password', {err: err, user: user});
		}else{
			var newPwd = req.body.new_pwd;
			var newPwdAgain = req.body.new_pwd_again;
			if(newPwd==''){
				res.render('reset_password', {err: 'Please enter your new password',  user: user});
			}else if(newPwd!==newPwdAgain){
				res.render('reset_password', {err: 'Passwords do not match',  user: user});
			}else{
				user_service.updatepassword(user, newPwd, function(err, user){
					if(err){
						res.render('reset_password', {err: err, user: user});
					}else{
						res.render('reset_password_done');
					}
				});
			}
		}
	});
}


exports.activation = function(req, res){
	user_service.activate( req.params.email, req.params.token, function(err){
		res.render('activation', {err: err});
	});
}

exports.sendemail = function(req, res){
	var email_service =  require('../services/email'); 
	email_service.sendTestEmail();
}

exports.refer_accept = function(req, res){
	console.log( req.params.email);
	console.log( req.params.inviter_id);
}
