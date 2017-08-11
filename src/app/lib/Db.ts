import swdbTools = require('./CommonTools');
import mongoose = require('mongoose');
import fs = require('fs');
import util = require('util');
import mongodb = require('mongodb');
export class Db {
  //  props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
  static schema: any;
  static swDoc: any;
  static swNamesDoc: any;
  static dbConnect: any;
  static swNamesSchema: any;
  constructor() {
    let tools = new swdbTools.CommonTools();
    var props: any = {};
    props = tools.getConfiguration();
    if (!Db.schema) {
      console.log("No db connection found, making one...");
      Db.schema = new mongoose.Schema({
        //id: {type: String, required: true, unique: true},
        swName: { type: String, required: true },
        version: String,
        branch: String,
        desc: String,
        owner: { type: String, required: true },
        engineer: { type: String, required: false },
        levelOfCare: { type: String, enum: props.levelOfCareEnums, required: true },
        status: { type: String, enum: props.statusEnums, required: true },
        statusDate: { type: Date, required: true },
        platforms: String,
        designDescDocLoc: String,
        descDocLoc: String,
        vvProcLoc: String,
        vvResultsLoc: String,
        versionControl: { type: String, enum: props.rcsEnums },
        versionControlLoc: String,
        recertFreq: String,
        recertStatus: String,
        recertDate: Date,
        previous: String,
        comment: String
      }, { emitIndexErrors: true });

      Db.schema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });

      Db.swNamesSchema = new mongoose.Schema({
        swName: String,
      }, { emitIndexErrors: true });
      Db.swDoc = mongoose.model('swdb', Db.schema, 'swdbCollection');
      Db.swNamesDoc = mongoose.model('props', Db.swNamesSchema, 'swNamesProp');
      console.log("Connecting to mongo... " + JSON.stringify(props.mongodbUrl));
      Db.dbConnect = mongoose.connect(props.mongodbUrl, (err, db) => {
        if (!err) {
          // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
          console.log("connected to mongo... " + JSON.stringify(props.mongodbUrl));
        } else {
          console.log("Error: " + err);
        }
      });
    }
  }

  // general function to find a request ID in a request and
  // return it, if available
  getReqId = function (req) {
    var id = null;
    if (req.url.match(/[^v][\da-fA-F]+$/) !== null) {
      var urlParts = req.url.split("/");
      id = urlParts[urlParts.length - 1];
      return id;
    } else {
      return null;
    }
  };

  findByName = function (searchName) {
    exports.swDoc.findOne({ swName: searchName }, function (err, doc) {
      return (doc);
    });
  };

  findById = function (searchId) {
    exports.swDoc.findOne({ _id: searchId }, function (err, doc) {
      return (doc);
    });
  };


  // Create a new record in the backend storage
  createDoc = function (req, res, next) {

    var doc = new Db.swDoc(req.body);
    //console.log(JSON.stringify(req.body,null,2));
    doc.save(function (err) {
      if (err) {
        next(err);
      } else {
        res.location('/swdb/v1/' + req.body._id);
        res.status(201);
        res.send();
      }
    });
  };

  getDocs = function (req, res, next) {
    var id = this.getReqId(req);
    if (!id) {
      // return all
      Db.swDoc.find({}, function (err, docs) {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    } else {
      // return specified item`
      Db.swDoc.findOne({ '_id': id }, function (err, docs) {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    }
  };

  updateDoc = function (req, res, next) {
    var id = this.getReqId(req);
    if (id) {
      var doc = Db.swDoc.findOne({ "_id": id }, function (err, doc) {
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
          doc.save(function (err) {
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
  getList = function (req, res, next) {
    var response = {};
    var obj_ids = req.body.map(function (id) { return id; });
    Db.swDoc.find({}, function (err, docs) {
    });
    Db.swDoc.find({ _id: { $in: obj_ids } }, (err, docs) => {
      if (err) {
        console.log("err:" + JSON.stringify(err));
        return next(err);
      } else {
        var results = {};
        //console.log("found docs:"+ JSON.stringify(docs));
        for (var idx = 0; idx < docs.length; idx++) {
          this.rec = docs[idx];
          results[this.rec.id] = {
            "swName": docs[idx].swName,
            "version": docs[idx].version,
            "branch": docs[idx].branch
          };
        }
        res.send(results);
      }
    });
  };

  deleteDoc = function (req, res, next) {
    var id = this.getReqId(req);

    // mongoose does not error if deleting something that does not exist
    Db.swDoc.findOne({ "_id": id }, function (err, doc) {
      if (doc) {
        Db.swDoc.remove({ '_id': id }, function (err) {
          if (!err) {
            res.end();
          } else {
          }
        });
      } else {
        return next(err);

      }
    });
  };
}