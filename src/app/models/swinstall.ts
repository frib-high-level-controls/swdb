/**
 * Model to represent Software or Firmware.
 */
import * as mongoose from 'mongoose';

import * as Debug from 'debug';
import express = require('express');

import * as auth from '../shared/auth';
import * as history from '../shared/history';
import * as models from '../shared/models';

const debug = Debug('swdb:models:swinstall');


export enum Status {
  RDY_INST = 'RDY_INST',
  RDY_VER = 'RDY_VER',
  RDY_BEAM = 'RDY_BEAM',
  RET = 'RET',
}

export interface ISWInstall extends history.IHistory {
  _id: any;
  host: string;
  name?: string;
  area: string[];
  slots?: string[];
  status: string;
  statusDate: Date;
  software: string;
  vvResultsLoc?: string[];
  vvApprovalDate?: Date;
  drrs?: string;
}

export interface SWInstall extends ISWInstall, history.Document<SWInstall> {
  // no additional methods
}

export const STATUSES: Status[] = [
  Status.RDY_INST,
  Status.RDY_VER,
  Status.RDY_BEAM,
  Status.RET,
];


// import express = require('express');
// import mongodb = require('mongodb');
// import mongoose = require('mongoose');

// import * as auth from '../shared/auth';
// import * as history from '../shared/history';

// import dbg = require('debug');
// import CommonTools = require('./CommonTools');

// const debug = dbg('swdb:instDb');

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const swInstallSchema = new Schema({
  host: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  area: {
    type: [String],
    //enum: InstDb.props.areaLabels,
    required: true,
  },
  slots: {
    type: [String],
  },
  status: {
    type: String,
    enum: STATUSES,
    required: true,
  },
  statusDate: {
    type: Date,
    required: true,
  },
  software: {
    type: ObjectId,
    required: true,
  },
  vvResultsLoc: {
    type: [String],
  },
  vvApprovalDate: {
    type: Date,
  },
  drrs: {
    type: String,
    default: '',
  },
}, {
  emitIndexErrors: true,
});

swInstallSchema.index({ host: 1, name: 1, software: 1 }, { unique: true });

history.addHistory(swInstallSchema, {
  watchAll: true,
});

export const SWInstall = history.model<SWInstall>('inst', swInstallSchema, 'instCollection');



// Create a new record in the backend storage
export const createDoc = async (user: string, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const doc = new SWInstall(req.body);
  try {
    await doc.saveWithHistory(auth.formatRole('USR', user));
    debug('Created installation ' + JSON.stringify(doc, null, 2) + ' as ' + req.session!.username);
    res.location(`${res.locals.basePath || ''}/api/v1/inst/${doc.id}`);
    res.status(201);
    res.send();
  } catch (err) {
      debug('Error creating installation ' + doc._id + err);
      next(err);
  }
};

/**
 * createDocByRecord - crates a new record given a single sw record
 *
 * @param user The user making the request (String)
 * @param req The requested sw record to save
 */
export const createDocByRecord = async (user: string, req: express.Request) => {
  const doc = new SWInstall(req);

  try {
    await doc.saveWithHistory(auth.formatRole('USR', user));
    debug('Created installation ' + doc._id + ' as ' + user);
  } catch (err) {
      debug('Error creating installation ' + doc._id + ': ' + err);
  }
};

export const getDocs = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Convert DB Model to Web API
  function toAPI(doc: ISWInstall): webapi.Inst {
    return {
      _id: String(doc._id),
      host: doc.host,
      name: doc.name,
      area: doc.area,
      slots: doc.slots,
      status: doc.status,
      statusDate: (doc.statusDate.getUTCMonth() + 1).toString() + '/' +
        doc.statusDate.getUTCDate() + '/' + doc.statusDate.getUTCFullYear(),
      software: doc.software,
      vvResultsLoc: doc.vvResultsLoc,
      vvApprovalDate: doc.vvApprovalDate ? (doc.vvApprovalDate.getUTCMonth() +1).toString() + '/' +
        doc.vvApprovalDate.getUTCDate() + '/' + doc.vvApprovalDate.getUTCFullYear() : undefined,
      drrs: doc.drrs,
    };
  }
  const id = req.params.id;
  if (!id) {
    // return all
    SWInstall.find({}, (err: Error, docs: ISWInstall[]) => {
      if (!err) {
        res.json(docs.map(toAPI));
      } else {
        next(err);
      }
    });
  } else {
    // return specified item
    SWInstall.findOne({ _id: id }, (err: Error, docs: ISWInstall) => {
      if (!err) {
        res.send(toAPI(docs));
      } else {
        next(err);
      }
    });
  }
};

export const getHist = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    const cursor = history.Update.find({ rid: models.ObjectId(id) })
      .sort({at: -1}).limit(Number(limit)).skip(Number(skip));
    try {
      const arr = await cursor.exec();
      debug('found history ' + JSON.stringify(arr, null, 2));
      res.send(arr);
    } catch (err) {
      next(err);
    }
  }
};

export const updateDoc = async (user: string, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = req.params.id;
  if (id) {
    SWInstall.findOne({ _id: id }, async (err: Error, founddoc: any) => {
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
          debug('Updated installation ' + JSON.stringify(founddoc, null, 2) + ' as ' + req.session!.username);
          res.location(`${res.locals.basePath || ''}/api/v1/inst/${founddoc.id}`);
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
};

export const chkConn = async () => {
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
};

export const chkIdx = async () => {
  // Ensure the index is created
  await new Promise((resolve, reject) => {
    SWInstall.on('error', reject);
    SWInstall.on('index', resolve);
  });
};

export const deleteDoc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = req.params.id;

  // mongoose does not error if deleting something that does not exist
  SWInstall.findOne({ _id: id }, (err: Error, doc: mongoose.Document) => {
    if (doc) {
      exports.instDoc.remove({ _id: id }, (rmerr: Error) => {
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
}

