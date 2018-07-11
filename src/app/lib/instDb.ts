import express = require('express');
import mongodb = require('mongodb');
import mongoose = require('mongoose');

import * as auth from '../shared/auth';
import * as history from '../shared/history';

import CommonTools = require('./CommonTools');
import dbg = require('debug');

const debug = dbg('swdb:instDb');

export class InstDb {
  public static instDoc: any;
  public static props: any;
  private static instSchema: mongoose.Schema;
  private static dbConnect: any;

  constructor(noconnect?: boolean) {
    const ctools = new CommonTools.CommonTools();
    InstDb.props = ctools.getConfiguration();
    if (!InstDb.instSchema) {
      InstDb.instSchema = new mongoose.Schema({
        host: { type: String, required: true },
        name: { type: String , default: '' },
        area: { type: [String], enum: InstDb.props.areaLabels, required: true },
        slots: [String],
        status: { type: String, enum: InstDb.props.instStatusKeys, required: true },
        statusDate: { type: Date, required: true },
        software: { type: mongoose.SchemaTypes.ObjectId, required: true },
        vvResultsLoc: { type: [String] },
        vvApprovalDate: { type: Date },
        drrs: { type: String, default: '' },
      }, { emitIndexErrors: true });

      // Use native promises
      mongoose.Promise = global.Promise;

      InstDb.instSchema.index({ host: 1, name: 1, software: 1 }, { unique: true });
      history.addHistory(InstDb.instSchema, {
        pathsToWatch: ['host', 'name', 'area', 'slots', 'status', 'statusDate',
          'software', 'vvResultsLoc', 'vvApprovalDate', 'drrs' ],
        });

      // InstDb.instDoc = mongoose.model('inst', InstDb.instSchema, 'instCollection');
      InstDb.instDoc = history.model<Model>('inst', InstDb.instSchema, 'instCollection');

      if (!noconnect) {
        InstDb.dbConnect = mongoose.connect(InstDb.props.mongodbUrl, (err: Error) => {
          if (!err) {
            debug('DB connected...' + JSON.stringify(InstDb.dbConnect));
          } else {
            debug('Error: ' + err);
          }
        });
      }
    }
    // debug('InstDb.instSchema now:' + JSON.stringify(InstDb.instSchema));
    // debug('InstDb.instDoc now:' + JSON.stringify(InstDb.instDoc));
    // debug('InstDb.dbConnect now:' + JSON.stringify(InstDb.dbConnect));
  }

  // Create a new record in the backend storage
  public createDoc = async (user: string,
    req: express.Request, res: express.Response, next: express.NextFunction) => {
    const doc = new InstDb.instDoc(req.body);
    try {
      await doc.saveWithHistory(auth.formatRole('USR', user));
      debug('Created installation ' + doc._id + ' as ' + req.session!.username);
      res.location(InstDb.props.instApiUrl + doc._id);
      res.status(201);
      res.send();
    } catch (err) {
        debug('Error creating installation ' + doc._id + err);
        next(err);
    }
  }

  /**
   * createDocByRecord - crates a new record given a single sw record
   *
   * @param user The user making the request (String)
   * @param req The requested sw record to save
   */
  public createDocByRecord = async (user: string, req: express.Request) => {
    const doc = new InstDb.instDoc(req);

    try {
      await doc.saveWithHistory(auth.formatRole('USR', user));
      debug('Created installation ' + doc._id + ' as ' + user);
    } catch (err) {
        debug('Error creating installation ' + doc._id + ': ' + err);
    }
  }
  public getDocs = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Convert DB Model to Web API
    function toAPI(doc: IInstModel): webapi.Inst{
      return {
        id: String(doc._id),
        host: doc.host,
        name: doc.name,
        area: doc.area,
        slots: doc.slots,
        status: doc.status,
        statusDate: doc.statusDate.toISOString(),
        software: doc.software,
        vvResultsLoc: doc.vvResultsLoc,
        vvApprovalDate: doc.vvApprovalDate ? doc.vvApprovalDate.toISOString() : undefined,
        drrs: doc.drrs ? doc.drrs.toISOString() : undefined,
      };
    }
    const id = req.params.id;
    if (!id) {
      // return all
      InstDb.instDoc.find({}, function(err: Error, docs: IInstModel[]) {
        if (!err) {
          res.json(docs.map(toAPI));
        } else {
          next(err);
        }
      });
    } else {
      // return specified item`
      InstDb.instDoc.findOne({ _id: id }, function(err: Error, docs: IInstModel) {
        if (!err) {
          res.send(toAPI(docs));
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

    const id = req.params.id;
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

  public updateDoc = async (user: string,
    req: express.Request, res: express.Response, next: express.NextFunction) => {
    const id = req.params.id;
    if (id) {
      InstDb.instDoc.findOne({ _id: id }, async (err: Error, founddoc: any) => {
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
            await founddoc.saveWithHistory(auth.formatRole('USR', user));
            debug('Updated installation ' + founddoc._id + ' as ' + req.session!.username);
            res.location(InstDb.props.instApiUrl + founddoc._id);
            res.end();
          } catch (err) {
            next(err);
          }
        } else {
          return next(new Error('Record not found'));
        }
      });
    } else {
      next(new Error('Record not found'));
    }
  }

  public chkConn = async () => {
    // Ensure the database is connected
    if (mongoose.connection.readyState !== 1) {
      // Otherwise, wait for the the 'connected' or 'error' event
      await new Promise((resolve, reject) => {
        mongoose.connection.once('error', reject);
        mongoose.connection.once('connected', resolve);
      });
    } else {
      debug('Connection established...');
    }
  }

  public chkIdx = async () => {
    // Ensure the index is created
    await new Promise((resolve, reject) => {
      InstDb.instDoc.on('error', reject);
      InstDb.instDoc.on('index', resolve);
    });
  }


  public deleteDoc = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;

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
  vvApprovalDate?: Date;
  drrs?: Date;
}

interface Model extends IInstModel, history.Document<Model> {}
