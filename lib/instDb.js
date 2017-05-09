var mongoose = require('mongoose');
var instTools = require('./instLib.js');
var fs = require('fs');
var util = require('util');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));

var instSchema = new mongoose.Schema({
  host: {type: String, required: true},
  area: [String],
  slots: [String],
  status: {type: String, enum: props.instStatusEnums, required: true},
  statusDate: {type: Date, required: true},
  software: {type: String, required: true},
  vvResultsLoc: String,
  ddrs: [String]
},{emitIndexErrors: true});

instSchema.index({host: 1, software: 1}, {unique: true});

//exports.swDoc = mongoose.model('swdb', schema, 'swdbCollection');
//exports.swNamesDoc = mongoose.model('props', swNamesSchema, 'swNamesProp');
exports.instDoc = mongoose.model('inst', instSchema, 'instCollection');

//exports.dbConnect = mongoose.connect(props.mongodbUrl, function(err, db) {
  //if(!err) {
    //console.log("connected to mongo... "+props.mongodbUrl);
  //} else {
    //console.log(err);
  //}

//});

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

  var doc = new exports.instDoc(req.body);
  //console.log(JSON.stringify(req.body,null,2));
  doc.save(function(err){
    if(err) {
      next(err);
    } else {
      res.location('/inst/details/'+req.body._id);
      res.status(201);
      res.send();
    }
  });
};

exports.getDocs = function(req, res, next) {
  var id = instTools.getReqId(req);
  if (!id) {
    // return all
    exports.instDoc.find({}, function(err, docs) {
      if(!err){
        res.send(docs);
      } else {
        next(err);
      }
    });
  } else {
    // return specified item`
    exports.instDoc.findOne({'_id': id}, function(err, docs) {
      if(!err){
        res.send(docs);
      } else {
        next(err);
      }
    });
  }
};

exports.updateDoc = function(req, res, next) {
  var id = instTools.getReqId(req);
  if (id) {
    var doc = exports.instDoc.findOne({"_id": id}, function(err,doc) {
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
  var id = instTools.getReqId(req);

  // mongoose does not error if deleting something that does not exist
  exports.instDoc.findOne({"_id": id}, function(err,doc) {
    if (doc) {
      exports.instDoc.remove({'_id': id}, function(err) {
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
