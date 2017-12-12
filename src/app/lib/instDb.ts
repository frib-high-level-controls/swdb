import express = require('express');
import fs = require('fs');
import mongodb = require('mongodb');
import mongoose = require('mongoose');
import util = require('util');
import instTools = require('./instLib');
import swdbEnums = require('./swdbEnums');
import swdbTools = require('./swdblib');
import * as history from '../shared/history';

import CommonTools = require('./CommonTools');
import dbg = require('debug');
const debug = dbg('swdb:instDb');

// interface InstSchema extends mongoose.Document {
//   host: string;
//   name?: string;
//   area: swdbEnums.AreaEnum;
//   slots?: string;
//   status: swdbEnums.InstStatusEnum;
//   statusDate: Date;
//   software: string;
//   vvResultLoc?: string;
//   drrs?: string;
// }

export class InstDb {
  public static instDoc: any;
  public static props: any;
  private static instSchema: mongoose.Schema;
  private static dbConnect: any;

  constructor() {
    const ctools = new CommonTools.CommonTools();
    InstDb.props = ctools.getConfiguration();
    if (!InstDb.instSchema) {
      InstDb.instSchema = new mongoose.Schema({
        host: { type: String, required: true },
        name: { type: String , default: '' },
        area: { type: String, enum: InstDb.props.areaLabels, required: true },
        slots: [String],
        status: { type: String, enum: InstDb.props.instStatusLabels, required: true },
        statusDate: { type: Date, required: true },
        software: { type: String, required: true },
        vvResultsLoc: { type: String, default: '' },
        drrs: { type: String, default: '' },
      }, { emitIndexErrors: true });

      // Use native promises
      mongoose.Promise = global.Promise;

      InstDb.instSchema.index({ host: 1, name: 1, software: 1 }, { unique: true });
      history.addHistory(InstDb.instSchema, {
        pathsToWatch: ['host', 'name', 'area', 'slots', 'status', 'statusDate',
          'software', 'vvResultsLoc', 'drrs' ],
        });

      // InstDb.instDoc = mongoose.model('inst', InstDb.instSchema, 'instCollection');
      InstDb.instDoc = history.model<Model>('inst', InstDb.instSchema, 'instCollection');

      InstDb.dbConnect = mongoose.connect(InstDb.props.mongodbUrl, (err: Error) => {
        if (!err) {
          // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
          // console.log("connected to mongo... " + JSON.stringify(props.mongodbUrl));
        } else {
          // console.log("Error: " + err);
        }
      });
    }
    debug('InstDb.instSchema now:' + JSON.stringify(InstDb.instSchema));
    debug('InstDb.instDoc now:' + JSON.stringify(InstDb.instDoc));
    // debug('InstDb.dbConnect now:' + JSON.stringify(InstDb.dbConnect));
  }

  // Create a new record in the backend storage
  public createDoc = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const doc = new InstDb.instDoc(req.body);
    try {
      await doc.saveWithHistory(req.session!.username);
      debug('Created installation ' + doc._id + ' as ' + req.session!.username);
      res.location(InstDb.props.instApiUrl + doc._id);
      res.status(201);
      res.send();
    } catch (err) {
        debug('Error creating installation ' + doc._id + err);
        next(err);
    }
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

  public  getHist = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  /**
   * getHist method
   *
   * This function uses the id found in the URL, and query terms to return a JSON array of history
   * items relevant to the id presented via the express.Response.send() method.
   *
   * @params req The express Request object
   * @params res The express Response object
   */

    const id = instTools.InstLib.getReqId(req);
    debug('looking for installation history on ' + id );
    if (!id) {
      next(new Error('Search ID must be provided'));
    } else {
      // get query terms and set defaults , if needed
      let limit = req.query.limit;
      if (!limit) {
        limit = 5;
      }
      let skip = req.query.skip;
      if (!skip) {
        skip = 0;
      }
      debug('looking for history on ' + id + ' limit is ' + limit + ' skip is ' + skip);
      let cursor = InstDb.instDoc.db.collections.history.find({ rid: new mongodb.ObjectID(id) })
        .sort({at: -1}).limit(Number(limit)).skip(Number(skip));
      try {
        let arr = await cursor.toArray();
        debug('found history ' + JSON.stringify(arr, null, 2));
        res.send(arr);
      } catch (err) {
        next(err);
      }
    }
  }

  public updateDoc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const id = instTools.InstLib.getReqId(req);
    if (id) {
      const doc = InstDb.instDoc.findOne({ _id: id }, async (err: Error, founddoc: any) => {
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
          try {
            await founddoc.saveWithHistory(req.session!.username);
            debug('Updated installation ' + founddoc._id + ' as ' + req.session!.username);
            res.location(InstDb.props.instApiUrl + founddoc._id);
            res.end();
          } catch (err) {
            next(err);
          }
          // founddoc.save((saveerr: Error) => {
          //   if (saveerr) {
          //     return next(saveerr);
          //   } else {
          //     res.location(InstDb.props.instApiUrl + founddoc._id);
          //     res.end();
          //   }
          // });
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

interface IInstModel extends history.IHistory {
  [key: string]: any;

  host: string;
  name?: string;
  area: string;
  slots?: [string];
  status: string;
  statusDate: Date;
  software: string;
  vvResultsLoc?: string;
  drrs?: Date;
}

interface Model extends IInstModel, history.Document<Model> {}
