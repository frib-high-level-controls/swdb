import express = require('express');
import fs = require('fs');
import mongoose = require('mongoose');
import util = require('util');
import instTools = require('./instLib');
import swdbEnums = require('./swdbEnums');
import swdbTools = require('./swdblib');

import CommonTools = require('./CommonTools');

interface InstSchema extends mongoose.Document {
  host: string;
  name?: string;
  area: swdbEnums.AreaEnum;
  slots?: string;
  status: swdbEnums.InstStatusEnum;
  statusDate: Date;
  software: string;
  vvResultLoc?: string;
  drrs?: string;
}

export class InstDb {
  public static instDoc: any;
  private static instSchema: mongoose.Schema;
  private static dbConnect: any;
  private props: any;

  constructor() {
    const ctools = new CommonTools.CommonTools();
    this.props = ctools.getConfiguration();
    if (!InstDb.instSchema) {
      InstDb.instSchema = new mongoose.Schema({
        host: { type: String, required: true },
        name: { type: String , default: '' },
        area: { type: String, enum: this.props.areaLabels, required: true },
        slots: [String],
        status: { type: String, enum: this.props.instStatusLabels, required: true },
        statusDate: { type: Date, required: true },
        software: { type: String, required: true },
        vvResultsLoc: { type: String, default: '' },
        drrs: { type: String, default: '' },
      }, { emitIndexErrors: true });

      InstDb.instSchema.index({ host: 1, name: 1, software: 1 }, { unique: true });
      InstDb.instDoc = mongoose.model('inst', InstDb.instSchema, 'instCollection');

      InstDb.dbConnect = mongoose.connect(this.props.mongodbUrl, (err: Error) => {
        if (!err) {
          // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
          // console.log("connected to mongo... " + JSON.stringify(props.mongodbUrl));
        } else {
          // console.log("Error: " + err);
        }
      });
    }
  }

  // Create a new record in the backend storage
  public createDoc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const doc = new InstDb.instDoc(req.body);
    doc.save((err: mongoose.Error) => {
      if (err) {
        next(err);
      } else {
        res.location(this.props.instApiUrl + doc._id);
        res.status(201);
        res.send();
      }
    });
  }

  public getDocs = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = instTools.InstLib.getReqId(req);
    if (!id) {
      // return all
      InstDb.instDoc.find({}, function(err: Error, docs: mongoose.Document[]) {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    } else {
      // return specified item`
      InstDb.instDoc.findOne({ _id: id }, function(err: Error, docs: mongoose.Document[]) {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    }
  };

  public updateDoc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const id = instTools.InstLib.getReqId(req);
    if (id) {
      const doc = InstDb.instDoc.findOne({ _id: id }, (err: Error, founddoc: any) => {
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
          founddoc.save((saveerr: Error) => {
            if (saveerr) {
              return next(saveerr);
            } else {
              res.location(this.props.instApiUrl + founddoc._id);
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
  }

  public deleteDoc = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = instTools.InstLib.getReqId(req);

    // mongoose does not error if deleting something that does not exist
    InstDb.instDoc.findOne({ _id: id }, function(err: Error, doc: mongoose.Document) {
      if (doc) {
        exports.instDoc.remove({ _id: id }, function(rmerr: Error) {
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
