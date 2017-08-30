import fs = require('fs');
import mongoose = require('mongoose');
import util = require('util');
import instTools = require('./instLib.js');
import swdbTools = require('./swdblib.js');

import CommonTools = require('./CommonTools');

export class InstDb {
  public static instDoc: any;
  private static instSchema: any;
  private static dbConnect: any;

  constructor() {
    const ctools = new CommonTools.CommonTools();
    let props: any = {};
    props = ctools.getConfiguration();
    if (!InstDb.instSchema) {
      InstDb.instSchema = new mongoose.Schema({
        host: { type: String, required: true },
        area: { type: String, enum: props.areaEnums, required: true },
        slots: [String],
        status: { type: String, enum: props.instStatusEnums, required: true },
        statusDate: { type: Date, required: true },
        software: { type: String, required: true },
        vvResultsLoc: String,
        drrs: String,
      }, { emitIndexErrors: true });

      InstDb.instSchema.index({ host: 1, software: 1 }, { unique: true });
      InstDb.instDoc = mongoose.model('inst', InstDb.instSchema, 'instCollection');

      InstDb.dbConnect = mongoose.connect(props.mongodbUrl, (err, db) => {
        if (!err) {
          // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
          // console.log("connected to mongo... " + JSON.stringify(props.mongodbUrl));
        } else {
          // console.log("Error: " + err);
        }
      });
    }
  }

  public findByName = function(searchName) {
    InstDb.instDoc.findOne({ swName: searchName }, function(err, doc) {
      return (doc);
    });
  };

  public findById = function(searchId) {
    InstDb.instDoc.findOne({ _id: searchId }, function(err, doc) {
      return (doc);
    });
  };


  // Create a new record in the backend storage
  public createDoc = function(req, res, next) {

    const doc = new InstDb.instDoc(req.body);
    doc.save(function(err) {
      if (err) {
        next(err);
      } else {
        res.location('/inst/details/' + req.body._id);
        res.status(201);
        res.send();
      }
    });
  };

  public getDocs = function(req, res, next) {
    const id = instTools.getReqId(req);
    if (!id) {
      // return all
      InstDb.instDoc.find({}, function(err, docs) {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    } else {
      // return specified item`
      InstDb.instDoc.findOne({ _id: id }, function(err, docs) {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    }
  };

  public updateDoc = function(req, res, next) {
    const id = instTools.getReqId(req);
    if (id) {
      const doc = InstDb.instDoc.findOne({ _id: id }, function(err, founddoc) {
        if (founddoc) {
          for (const prop in req.body) {
            if (req.body.hasOwnProperty(prop)) {
              // overwrite the record property with this, but not id
              if (prop === '_id') {
                continue;
              }
              founddoc[prop] = req.body[prop];
            }
          }
          founddoc.save(function(saveerr) {
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

  public deleteDoc = function(req, res, next) {
    const id = instTools.getReqId(req);

    // mongoose does not error if deleting something that does not exist
    InstDb.instDoc.findOne({ _id: id }, function(err, doc) {
      if (doc) {
        exports.instDoc.remove({ _id: id }, function(rmerr) {
          if (!rmerr) {
            res.end();
          } else {
            next(new Error('Record not found'));
          }
        });
      } else {
        return next(err);
      }
    });
  };
}
