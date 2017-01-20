var mongoose = require('mongoose');
var tools = require('./swdblib.js');
var fs = require('fs');
var util = require('util');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));

// var errHandler = function(error, res, next) {
//   if (error.name === 'MongoError' && error.code === 11000) {
//     next(new Error('There was a duplicate key error'));
//   } else if (error.name === 'ValidationError') {
//     console.log("val err"+error);
//     next(new Error(error));
//   } else {
//     console.log(error);
//     next(new Error(error));
//   }
// };

var schema = new mongoose.Schema({
  //id: {type: String, required: true, unique: true},
  swName: {type: String, required: true, unique: true},
  owner: {type: String, required: true},
  levelOfCare: {type: String, enum: props.levelOfCareEnums, required: true},
  status: {type: String, enum: props.statusEnums, required: true},
  statusDate: {type: Date, required: true},
  releasedVersion: String,
  platforms: String,
  auxSw: [String],
  swDescDoc: [String],
  validationDoc: [{doc: String, date: Date}],
  verificationDoc: [{doc: String, date: Date}],
  verificationApprover: String,
  revisionControl: String,
  recertFreq: String,
  recertStatus: String,
  comment: [String]
},{emitIndexErrors: true});
// set error handling for db saves

// schema.post('save', errHandler);
// schema.post('update', errHandler);
// schema.post('findOneAndUpdate', errHandler);
// schema.post('insertMany', errHandler);
// schema.post('remove', errHandler);

exports.swDoc = mongoose.model('swdb', schema);

exports.dbConnect = mongoose.connect(props.mongodbUrl, function(err, db) {
  if(!err) {
    console.log("connected to mongo... "+props.mongodbUrl);
  } else {
    console.log(err);
  }

});

exports.findByName = function (searchName) {
  exports.swDoc.findOne({swName: searchName}, function(err, doc) {
    return(doc);
  });
};

exports.findById = function (searchId) {
  exports.swDoc.findOne({_id: searchId}, function(err, doc) {
  //console.log("searchId is "+searchId+doc);
    return(doc);
  });
};


// Create a new record in the backend storage
exports.createDoc = function (req, res, next) {

  var doc = new exports.swDoc(req.body);

  doc.save(function(err){
    if(err) {
      return next(err);
    } else {
      res.location('/swdb/v1/'+req.body._id);
      res.status(201);
      res.end();
    }
  });
};

exports.getDocs = function(req, res, next) {
  var id = tools.getReqId(req);
  if (!id) {
    // return all
    exports.swDoc.find({}, function(err, docs) {
      if(!err){
        res.send(docs);
      } else {
        next(err);
      }
    });
  } else {
    // return specified item`
    exports.swDoc.findOne({'_id': id}, function(err, docs) {
      if(!err){
        res.send(docs);
      } else {
        next(err);
      }
    });
  }
};

exports.updateDoc = function(req, res, next) {
  var id = tools.getReqId(req);
  if (id) {
    var doc = exports.swDoc.findOne({"_id": id}, function(err,doc) {
      if (doc) {
      for (var prop in req.body) {
        if (req.body.hasOwnProperty(prop)) {
          // overwrite the record property with this, but not id
          if (prop === "_id") {
            continue;
          }
          //console.log("Setting "+prop+" from "+doc[prop]+" to "+req.body[prop]);
          doc[prop] = req.body[prop];
        }
      }
        doc.save(function(err) {
          if (err) {
            return next(err);
          } else {
            res.end();
          }
        });
      } else {
         return next(new Error("Record not found"));
      }
    });
  } else {
    next(new Error("Record not found"));
  }
};

exports.deleteDoc = function(req, res, next) {
  var id = tools.getReqId(req);

  // mongoose does not error if deleting something that does not exist
  exports.swDoc.findOne({"_id": id}, function(err,doc) {
    if (doc) {
      exports.swDoc.remove({'_id': id}, function(err) {
         if(!err){
           res.end();
         }else{
         }
      });
    } else {
      return next(err);

    }
  });
};
