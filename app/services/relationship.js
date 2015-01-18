var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Relationship = mongoose.model('Relationship')
	utils = require('./utils'),
	ObjectId = require('mongoose').Types.ObjectId,
	socket_serivce = require('./sockets')(),
	utils = require('./utils'),
	async = require('async'),
	_=require('lodash')
	;


var findRelationship = function(from, to, cb){
	Relationship.findOne({
		from: from,
		to: to
	}).exec(function(err, doc){
		cb(err, doc);
	});
};

exports.findRelationship = function(from, to, cb){
	findRelationship( from, to, cb );
};

exports.removeRelationship = function(from, to, cb){
	
	var removeRelationship = function(relationship, cb){
		Relationship.findById(relationship._id).remove().exec();
		cb(null, relationship);
	};
	
	async.waterfall([
	                 	async.apply( findRelationship, from, to),
	                 	async.apply( removeRelationship)
	                 ], cb);
}

exports.upsertRelationship = function(from, to, is_family, cb){
	
	var upsertRelationship = function(from, to, is_family, relationship, cb){
		
		if(relationship){ 
			relationship.from = from;
			relationship.to = to;
			relationship.is_family = is_family;
		} else { 
			relationship = new Relationship(
				{
					from: from,
					to: to,
					is_family: is_family
				}		
			); 
		}
		relationship.save(function(err, doc){
			cb(err, doc);
		})
	};
	
	async.waterfall([
	                 	async.apply( findRelationship, from, to),
	                 	async.apply( upsertRelationship, from, to, is_family)
	                 ], cb);
};

exports.updateRelationship = function(from, toName, is_family, cb){
	var findUser = function(screenName, cb){
		Client.findOne({ screenName: screenName}).
		exec(function(err, doc){
			cb(err, doc);
		});
	};
	
	var update = function(is_family, relationship){
		relationship.is_family = is_family;
		relationship.save( function(err, doc){
			cb(err, doc);
		});
	};
	
	async.waterfall([
	                 	async.apply( findUser, toName),
	                 	async.apply( findRelationship, from),
	                 	async.apply( update, is_family)
	                 ], cb);
	
};
// level: 1 family, 2 friends, 3 all
exports.retrieveRelatedUsers = function(user, level, cb){
	var q = null;
	if(level==1){
		q=Relationship.find({
			from: user,
			is_family: true
		});
	} else if(level==2){
		q=Relationship.find({
			from: user,
			is_family: false
		});
	} else {
		q=Relationship.find({
			from: user
		});
	}
	
	q.populate("to").exec(function(err, docs){
		if(err){
			cb(err);
		}else{
			var results = [];
			_.each(docs, function(doc){
				results.push(doc.to);
			});
			if(level===3){
				results.push(user);
			}
			cb( null, results );
		}
	});
};

exports.detectRelationship = function(from, toName, cb){
	Client.findRelationship( toName, function(err, to){
		findRelationship( from, to, function(err, relationship){
			if(err){
				cb(err);
			}else if(relationship!=null){
				cb(null, [ to ])
			}else {
				cb(null, []);
			}
		});
	})
	
};

exports.retrieveRelationshipsBetween = function(from, tos, cb){
	
	
	Relationship.find({ //the relationship is dependent on creator, here should be from,
		from: {
			$in: tos
		},
		to:	from
	})
	.populate("from to")
	.exec(function(err, docs){ 
		cb(err, docs);
	});
}
