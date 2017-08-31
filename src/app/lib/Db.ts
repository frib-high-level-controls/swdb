import fs = require('fs');
import mongodb = require('mongodb');
import mongoose = require('mongoose');
import util = require('util');
import swdbTools = require('./CommonTools');
export class Db {
  //  props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
  public static swDoc: any;
  private static schema: any;
  private static dbConnect: any;
  constructor() {
    const tools = new swdbTools.CommonTools();
    let props: any = {};
    props = tools.getConfiguration();
    if (!Db.schema) {
      // console.log("No db connection found, making one...");
      Db.schema = new mongoose.Schema({
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
        comment: String,
      }, { emitIndexErrors: true });

      Db.schema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });

      Db.swDoc = mongoose.model('swdb', Db.schema, 'swdbCollection');
      // console.log("Connecting to mongo... " + JSON.stringify(props.mongodbUrl));
      Db.dbConnect = mongoose.connect(props.mongodbUrl, (err, db) => {
        if (!err) {
          // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
          // console.log("connected to mongo... " + JSON.stringify(props.mongodbUrl));
        } else {
          // console.log("Error: " + err);
        }
      });
    }
  }

  // general function to find a request ID in a request and
  // return it, if available
  public getReqId = (req) => {
    let id = null;
    if (req.url.match(/[^v][\da-fA-F]+$/) !== null) {
      const urlParts = req.url.split('/');
      id = urlParts[urlParts.length - 1];
      return id;
    } else {
      return null;
    }
  }

  public findByName = (searchName) => {
    exports.swDoc.findOne({ swName: searchName }, (err, doc) => {
      return (doc);
    });
  }

  public findById = (searchId) => {
    exports.swDoc.findOne({ _id: searchId }, (err, doc) => {
      return (doc);
    });
  }

  // Create a new record in the backend storage
  public createDoc = (req, res, next) => {

    const doc = new Db.swDoc(req.body);
    doc.save( (err) => {
      if (err) {
        next(err);
      } else {
        res.location('/swdb/v1/' + req.body._id);
        res.status(201);
        res.send();
      }
    });
  }

  public getDocs = function(req, res, next) {
    const id = this.getReqId(req);
    if (!id) {
      // return all
      Db.swDoc.find({}, (err, docs) => {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    } else {
      // return specified item`
      Db.swDoc.findOne({ _id: id }, (err, docs) => {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    }
  };

  public updateDoc = function(req, res, next) {
    const id = this.getReqId(req);
    if (id) {
      Db.swDoc.findOne({ _id: id }, (err, doc) => {
        if (doc) {
          for (const prop in req.body) {
            if (req.body.hasOwnProperty(prop)) {
              // overwrite the record property with this, but not id
              if (prop === '_id') {
                continue;
              }
              doc[prop] = req.body[prop];
            }
          }
          doc.save( (saveerr) => {
            if (saveerr) {
              return next(saveerr);
            } else {
              res.end();
            }
          });
        } else {
          return next(new Error('Record not found'));
        }
      });
    } else {
      next(new Error('Record not found'));
    }
  };

  // return array of records given an array of ids
  public getList = function(req, res, next) {
    const response = {};
    const objIds = req.body.map( (id) => id);
    Db.swDoc.find({ _id: { $in: objIds } }, (err, docs) => {
      if (err) {
        // console.log("err:" + JSON.stringify(err));
        return next(err);
      } else {
        const results = {};
        for (const doc of docs) {
          this.rec = doc;
          results[this.rec.id] = {
            swName: doc.swName,
            version: doc.version,
            branch: doc.branch,
          };
        }
        res.send(results);
      }
    });
  };

  public deleteDoc = function(req, res, next) {
    const id = this.getReqId(req);

    // mongoose does not error if deleting something that does not exist
    Db.swDoc.findOne({ _id: id }, (err, doc) => {
      if (doc) {
        Db.swDoc.remove({ _id: id }, (rmerr) => {
          if (!rmerr) {
            res.end();
          }
        });
      } else {
        return next(err);
      }
    });
  };
}
