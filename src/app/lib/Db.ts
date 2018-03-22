import fs = require('fs');
import mongodb = require('mongodb');
import mongoose = require('mongoose');
import * as history from '../shared/history';
import util = require('util');
import commonTools = require('./CommonTools');
import swdbTools = require('./swdblib');
import express = require('express');
import dbg = require('debug');
const debug = dbg('swdb:Db');

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
        vvProcLoc: { type: Array },
        vvResultsLoc: { type: Array },
        versionControl: { type: String, enum: Db.props.rcsLabels },
        versionControlLoc: { type: String},
        recertFreq: { type: String},
        recertStatus: { type: String},
        recertDate: Date,
        previous: { type: mongoose.SchemaTypes.ObjectId },
        comment: { type: String},
      }, { emitIndexErrors: true });

      // Use native promises
      mongoose.Promise = global.Promise;

      Db.schema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });

      history.addHistory(Db.schema, {
        pathsToWatch: ['swName', 'version', 'branch', 'desc', 'owner', 'engineer',
          'levelOfCare', 'status', 'statusDate', 'platforms', 'designDescDocLoc', 'descDocLoc',
          'vvProcLoc', 'vvResultsLoc', 'versionControl', 'versionControlLoc', 'recertFreq',
          'recertStatus', 'recertDate', 'previous', 'comment'],
        });

      Db.swDoc = history.model<Model>('swdb', Db.schema, 'swdbCollection');

      Db.dbConnect = mongoose.connect(Db.props.mongodbUrl, (err: Error) => {
        if (!err) {
          debug('DB connected...');
        } else {
          debug('Error: ' + err);
        }
      });
    }
    debug('Db.schema now:' + JSON.stringify(Db.schema));
    debug('swDoc now:' + JSON.stringify(Db.swDoc));
  }

  // Create a new record in the backend storage
  public createDoc = async (user: string | undefined,
    req: express.Request, res: express.Response, next: express.NextFunction) => {

    const doc = new Db.swDoc(req.body);

    try {
      await doc.saveWithHistory(user);
      debug('Created sw ' + doc._id + ' as ' + user);
      res.location(Db.props.apiUrl + doc._id);
      res.status(201);
      res.send();
    } catch (err) {
        debug('Error creating sw ' + doc._id + ': ' + err);
        next(err);
    }
  }
  /**
   * createDocByRecord - crates a new record given a single sw record
   * 
   * @param user The user making the request (String)
   * @param req The requested sw record to save
   */
  public createDocByRecord = async (user: string | undefined,
    req: any ) => {

    const doc = new Db.swDoc(req);

    try {
      await doc.saveWithHistory(user);
      debug('Created sw ' + doc._id + ' as ' + user);
    } catch (err) {
        debug('Error creating sw ' + doc._id + ': ' + err);
    }
  }

  public getDocs = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const id = req.params.id;
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
  }

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
      let cursor = Db.swDoc.db.collections.history.find({ rid: new mongodb.ObjectID(id) })
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

  public updateDoc = (user: string | undefined, req: express.Request, res: express.Response,
     next: express.NextFunction) => {
    const id = req.params.id;
    if (id) {
      Db.swDoc.findOne({ _id: id }, async (err: Error, doc: any) => {
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
          try {
            await doc.saveWithHistory(user);
            debug('Updated sw ' + doc._id + ' as ' + user);
            res.location(Db.props.apiUrl + doc._id);
            res.end();
          } catch (err) {
            debug('Error updating sw ' + doc._id + ': ' + err);
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

  // return array of records given an array of ids
  public getList = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
      Db.swDoc.on('error', reject);
      Db.swDoc.on('index', resolve);
    });
  }

  public deleteDoc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const id = req.params.id;

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
  }
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
  vvProcLoc?: [string];
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
