/**
 * Model to represent Software or Firmware.
 */
import * as mongoose from 'mongoose';

import * as Debug from 'debug';
import express = require('express');

import * as auth from '../shared/auth';
import * as history from '../shared/history';
import * as models from '../shared/models';

const debug = Debug('swdb:models:software');


export enum CareLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum Status {
  DEVEL = 'DEVEL',
  RDY_TEST = 'RDY_TEST',
  RDY_INST = 'RDY_INST',
  DEP = 'DEP',
}

export enum VersionControlSystem {
  GIT = 'GIT',
  AC =  'AC',
  FS = 'FS',
  DEB = 'DEB',
  OTHER = 'OTHER',
}

export type  VCS = VersionControlSystem;
export const VCS = VersionControlSystem;

export interface ISoftware extends history.IHistory {
  _id: any;
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
  vvProcLoc?: string[];
  vvResultsLoc?: string[];
  versionControl?: string;
  versionControlLoc?: string;
  previous?: string;
  comment?: string;
}

export interface Software extends ISoftware, history.Document<Software> {
  // no additional methods
}

export const CARE_LEVELS: CareLevel[] = [
  CareLevel.LOW,
  CareLevel.MEDIUM,
  CareLevel.HIGH,
];

export const STATUSES: Status[] = [
  Status.DEVEL,
  Status.RDY_TEST,
  Status.RDY_INST,
  Status.DEP,
];

export const VERSION_CONTROL_SYSTEMS: VCS[] = [
  VCS.GIT,
  VCS.AC,
  VCS.FS,
  VCS.DEB,
  VCS.OTHER,
];

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const softwareSchema = new Schema({
  swName: {
    type: String,
    required: true,
  },
  version: {
    type: String,
  },
  branch: {
    type: String,
  },
  desc: {
    type: String,
  },
  owner: {
    type: String,
    required: true,
  },
  engineer: {
    type: String,
    required: false,
  },
  levelOfCare: {
    type: String,
    enum: CARE_LEVELS,
    required: true,
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
  platforms: {
    type: String,
  },
  designDescDocLoc: {
    type: String,
  },
  descDocLoc: {
    type: String,
  },
  vvProcLoc: {
    type: [String],
  },
  vvResultsLoc: {
    type: [String],
  },
  versionControl: {
    type: String,
    enum: VERSION_CONTROL_SYSTEMS,
  },
  versionControlLoc: {
    type: String,
  },
  previous: {
    type: ObjectId,
  },
  comment: {
    type: String,
  },
}, {
  emitIndexErrors: true,
});

softwareSchema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });

history.addHistory(softwareSchema, {
  watchAll: true,
});

export const Software = history.model<Software>('swdb', softwareSchema, 'swdbCollection');

  // Create a new record in the backend storage
export const createDoc = async (user: string, req: express.Request, res: express.Response, next: express.NextFunction) => {

  const doc = new Software(req.body);

  try {
    await doc.saveWithHistory(auth.formatRole('USR', user));
    debug('Created sw ' + doc._id + ' as ' + user);
    res.location(`${res.locals.basePath || ''}/api/v1/swdb/${doc.id}`);
    res.status(201);
    res.send();
  } catch (err) {
      debug('Error creating sw ' + doc._id + ': ' + err);
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
  const doc = new Software(req);

  try {
    await doc.saveWithHistory(auth.formatRole('USR', user));
    debug('Created sw ' + doc._id + ' as ' + user);
  } catch (err) {
      debug('Error creating sw ' + doc._id + ': ' + err);
  }
};

export const getDocs = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = req.params.id;
  if (!id) {
    // return all
    Software.find({}, (err: Error, docs: any) => {
      if (!err) {
        res.send(docs);
      } else {
        next(err);
      }
    });
  } else {
    // return specified item`
    Software.findOne({ _id: id }, (err: Error, docs: any) => {
      if (!err) {
        res.send(docs);
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

export const updateDoc = (user: string, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = req.params.id;
  if (id) {
    Software.findOne({ _id: id }, async (err: Error, doc: any) => {
      if (doc) {
        for (const prop in req.body) {
          if (req.body.hasOwnProperty(prop)) {
            // overwrite the record property with this, but not id
            if (prop === '_id') {
              continue;
            }
            // watch for incoming deletes
            if (req.body[prop] === '') {
              if (doc[prop]) {
                doc[prop] = undefined;
              }
              continue;
            } else {
              doc[prop] = req.body[prop];
            }
          }
        }
        try {
          await doc.saveWithHistory(auth.formatRole('USR', user));
          debug('Updated sw ' + doc._id + ' as ' + user);
          res.location(`${res.locals.basePath || ''}/api/v1/swdb/${doc.id}`);
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
};

// return array of records given an array of ids
export const getList = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const objIds = req.body.map( (id: string) => id);
  Software.find({ _id: { $in: objIds } }, (err: Error, docs: any) => {
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
    Software.on('error', reject);
    Software.on('index', resolve);
  });
};

export const deleteDoc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = req.params.id;

  // mongoose does not error if deleting something that does not exist
  Software.findOne({ _id: id }, (err: Error, doc: any) => {
    if (doc) {
      Software.remove({ _id: id }, (rmerr: Error) => {
        if (!rmerr) {
          res.end();
        }
      });
    } else {
      return next(err);
    }
  });
};
