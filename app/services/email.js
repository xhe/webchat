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

exports.sendTestEmail = function(){ 
	console.log('called' + __dirname)
	var tpl = swig.compileFile( __dirname + '/../views/emails/test.server.view.html');
	console.log( tpl({ name: 'frank ' }))
};
