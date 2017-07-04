var mongoose = require('mongoose');
var tools = require('./swdblib.js');
var fs = require('fs');
var util = require('util');
var ObjectId = require('mongodb').ObjectID;
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));


var schema = new mongoose.Schema({
  //id: {type: String, required: true, unique: true},
  swName: {type: String, required: true},
  desc: [String],
  owner: {type: String, required: true},
  engineer: {type: String, required: false},
  levelOfCare: {type: String, enum: props.levelOfCareEnums, required: true},
  status: {type: String, enum: props.statusEnums, required: true},
  statusDate: {type: Date, required: true},
  version: String,
  branch: String,
  platforms: String,
  designDescDocLoc: String,
  descDocLoc: String,
  vvProcLoc: String,
  vvResultsLoc: String,
  versionControl: {type: String, enum: props.rcsEnums},
  versionControlLoc: String,
  recertFreq: String,
  recertStatus: String,
  recertDate: Date,
  previous: String,
  comment: [String]
},{emitIndexErrors: true});

schema.index({swName: 1, version: 1, branch: 1}, {unique: true});

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

// return array of records given an array of ids
exports.getList = function (req, res, next) {
  var response={};
  //console.log("getList got:"+ JSON.stringify(req.body));
  //var obj_ids = req.body.map(function(id) { return ObjectId(id); });
  var obj_ids = req.body.map(function(id) { return id; });
  //obj_ids = [ObjectId("5947589458a6aa0face9a511")];
  //console.log("obj_ids:"+ JSON.stringify(obj_ids));
  exports.swDoc.find({}, function(err,docs){
      //console.log("docs:"+ JSON.stringify(docs));
      //console.log("err:"+ JSON.stringify(err));
  });
  exports.swDoc.find({_id: {$in: obj_ids}}, function(err,docs){
    if (err) {
      console.log("err:"+ JSON.stringify(err));
      return next(err);
    } else {
      var results = {};
      //console.log("found docs:"+ JSON.stringify(docs));
      for (var idx = 0; idx < docs.length; idx++ ) {
        rec = docs[idx];
        results[rec.id] = {
          "swName":docs[idx].swName,
          "version":docs[idx].version,
          "branch":docs[idx].branch
        };
      }
      res.send(results);
    }
  });
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
