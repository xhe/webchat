var config = require('../../config/config');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var swig  = require('swig');

var sendEmail = function(receipientEmail, receipientName, title, bodyHtml, bodyText){
	
	var transporter;
	
	if(config.smtp.service=='localhost'){
		transporter = nodemailer.createTransport(smtpTransport({
		    host: config.smtp.service,
		    port: 25
		}));
	}else{
		transporter = nodemailer.createTransport({
		    service: config.smtp.service,
		    auth: {
		        user: config.smtp.auth.username,
		        pass: config.smtp.auth.password
		    }
		});
	}
	// setup e-mail data with unicode symbols
	var mailOptions = {
	    from: "support@chat4each.com",
	    to:  receipientName+"<"+receipientEmail+">", // list of receivers
	    subject: title, // Subject line
	    text: bodyText, // plaintext body
	    html:bodyHtml // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        console.log(error);
	    }else{
	        console.log('Message sent: ' + info.response);
	    }
	});
};

var tpl = function(name, type){
	if(!type)
		type='html';
	return swig.compileFile( __dirname + '/../views/emails/'+name+'.'+type+'.server.view.html');
};

exports.sendTestEmail = function(){ 
	sendEmail('hexufeng@gmail.com', "Xufeng He", "test email", tpl('test','html')({ name: 'frank ' }), tpl('test','text')({ name: 'frank He' }) );
};

exports.sendActivationEmail = function(client){
	sendEmail( 	client.email,
				client.firstName+ " "+client.lastName,
				"Account Activtion",
				tpl('activation','html')( { client: client, url: config.host_url+'activation/'+client.email+'/'+client.token } ),
				tpl('activation','text')( { client: client, url: config.host_url+'activation/'+client.email+'/'+client.token } )
	);

}
