import fs = require('fs');
import mongodb = require('mongodb');
import mongoose = require('mongoose');
import * as history from '../shared/history';
import util = require('util');
import commonTools = require('./CommonTools');
import swdbTools = require('./swdblib');
import express = require('express');

export class Db {
  public static swDoc: any;
  public static props: any;
  private static schema: any;
  private static dbConnect: any;
  constructor() {
    const tools = new commonTools.CommonTools();
    Db.props = tools.getConfiguration();
    if (!Db.schema) {
      // console.log("No db connection found, making one...");
      Db.schema = new mongoose.Schema({
        swName: { type: String, required: true },
        version: { type: String},
        branch: { type: String},
        desc: { type: String},
        owner: { type: String, required: true },
        engineer: { type: String, required: false },
        levelOfCare: { type: String, enum: Db.props.levelOfCareLabels, required: true },
        status: { type: String, enum: Db.props.statusLabels, required: true },
        statusDate: { type: Date, required: true },
        platforms: { type: String},
        designDescDocLoc: { type: String},
        descDocLoc: { type: String},
        vvProcLoc: { type: String},
        vvResultsLoc: { type: String},
        versionControl: { type: String, enum: Db.props.rcsLabels },
        versionControlLoc: { type: String},
        recertFreq: { type: String},
        recertStatus: { type: String},
        recertDate: Date,
        previous: { type: String},
        comment: { type: String},
      }, { emitIndexErrors: true });

      Db.schema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });

      history.addHistory(Db.schema, {
        pathsToWatch: ['swName', 'version', 'branch', 'desc', 'owner', 'engineer', 
          'leveOfCare', 'status', 'statusDate', 'platforms', 'designDescDocLoc', 'descDocLoc',
          'vvProcLoc', 'vvResultsLoc', 'versionControl', 'versionControlLoc', 'recertFreq',
          'recertStatus', 'recertDate', 'previous', 'comment'],
        });

      Db.swDoc = history.model<Model>('swdb', Db.schema, 'swdbCollection');

      // Db.swDoc = mongoose.model('swdb', Db.schema, 'swdbCollection');
      // console.log("Connecting to mongo... " + JSON.stringify(props.mongodbUrl));
      Db.dbConnect = mongoose.connect(Db.props.mongodbUrl, (err: Error) => {
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

    const doc = new Db.swDoc(req.body);
    doc.save( (err: Error) => {
      if (err) {
        next(err);
      } else {
        // console.log('saved: ' + JSON.stringify(doc));
        res.location(Db.props.apiUrl + doc._id);
        res.status(201);
        res.send();
      }
    });
  }

  public getDocs = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = swdbTools.SwdbLib.getReqId(req);
    if (!id) {
      // return all
      Db.swDoc.find({}, (err: Error, docs: any) => {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    } else {
      // return specified item`
      Db.swDoc.findOne({ _id: id }, (err: Error, docs: any) => {
        if (!err) {
          res.send(docs);
        } else {
          next(err);
        }
      });
    }
  };

  public updateDoc = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = swdbTools.SwdbLib.getReqId(req);
    if (id) {
      Db.swDoc.findOne({ _id: id }, (err: Error, doc: any) => {
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
          doc.save( (saveerr: Error) => {
            if (saveerr) {
              return next(saveerr);
            } else {
              res.location(Db.props.apiUrl + doc._id);
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
  public getList = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const response = {};
    const objIds = req.body.map( (id: string) => id);
    Db.swDoc.find({ _id: { $in: objIds } }, (err: Error, docs: any) => {
      if (err) {
        // console.log("err:" + JSON.stringify(err));
        return next(err);
      } else {
        const results: {[key: string]: {swName: string, version: string, branch: string}} = {};
        for (const doc of docs) {
          // this.rec = doc;
          results[doc.id] = {
            swName: doc.swName,
            version: doc.version,
            branch: doc.branch,
          };
        }
        res.send(results);
      }
    });
  };

  public deleteDoc = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = swdbTools.SwdbLib.getReqId(req);

    // mongoose does not error if deleting something that does not exist
    Db.swDoc.findOne({ _id: id }, (err: Error, doc: any) => {
      if (doc) {
        Db.swDoc.remove({ _id: id }, (rmerr: Error) => {
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

// interface ISwdbDoc extends mongoose.MongooseDocument {
interface ISwdbModel extends history.IHistory {
  [key: string]: any;

  swName: string;
  version?: string;
  branch?: string;
  desc?: string;
  owner: string;
  engineer?: string;
  levelOfCare: string;
  status: string;
  statusDate: Date;
  platforms?: string;
  designDescDocLoc?: string;
  descDocLoc?: string;
  vvProcLoc?: string;
  vvResultsLoc?: string;
  versionControl?: string;
  versionControlLoc?: string;
  recertFreq?: string;
  recertStatus?: string;
  recertDate?: Date;
  previous?: string;
  comment?: string;
}

interface Model extends ISwdbModel, history.Document<Model> {}
