var mongoose = require('mongoose');
var tools = require('./swdblib.js');
var fs = require('fs');
var util = require('util');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));


var schema = new mongoose.Schema({
  //id: {type: String, required: true, unique: true},
  swName: {type: String, required: true, unique: true},
  desc: [String],
  owner: {type: String, required: true},
  engineer: {type: String, required: false},
  levelOfCare: {type: String, enum: props.levelOfCareEnums, required: true},
  status: {type: String, enum: props.statusEnums, required: true},
  statusDate: {type: Date, required: true},
  releasedVersion: String,
  branch: String,
  platforms: String,
  auxSw: [String],
  designDescDocLoc: String,
  descDocLoc: String,
  vvProcLoc: String,
  vvResultsLoc: String,
  revisionControl: String,
  versionControlLoc: String,
  recertFreq: String,
  recertStatus: String,
  recertDate: Date,
  comment: [String]
},{emitIndexErrors: true});

var swNamesSchema = new mongoose.Schema({
  swName: String,
},{emitIndexErrors: true});

exports.swDoc = mongoose.model('swdb', schema, 'swdbCollection');
exports.swNamesDoc = mongoose.model('props', swNamesSchema, 'swNamesProp');

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
    return(doc);
  });
};


// Create a new record in the backend storage
exports.createDoc = function (req, res, next) {

  var doc = new exports.swDoc(req.body);
  //console.log(JSON.stringify(req.body,null,2));
  doc.save(function(err){
    if(err) {
      next(err);
    } else {
      res.location('/swdb/v1/'+req.body._id);
      res.status(201);
      res.send();
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
          doc[prop] = req.body[prop];
        }
      }
        //console.log(JSON.stringify(req.body,null,2));
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
