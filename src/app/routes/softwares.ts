/**
 * Route handlers for software API.
 */
import * as Debug from 'debug';
import * as express from 'express';
import { isEqual } from 'lodash';

import * as auth from '../shared/auth';
import * as history from '../shared/history';
import * as models from '../shared/models';

import * as legacy from '../lib/legacy';

import {
  CustomValidators,
  IValResult,
} from '../lib/validators';

import {
  checkNewSoftware,
} from '../lib/validation';

import {
  catchAll,
  HttpStatus,
  RequestError,
  validationResult,
} from '../shared/handlers';

import {
  ISoftware,
  Software,
} from '../models/software';


const NOT_FOUND = HttpStatus.NOT_FOUND;


const debug = Debug('swdb:routes:api-software');

const router = express.Router();

export function getRouter(opts?: {}): express.Router {
  return router;
}

// Convert DB Model to Web API
function toWebAPI(doc: ISoftware): webapi.Software {
  return {
    _id: String(doc._id),
    swName: doc.swName,
    version: doc.version,
    branch: doc.branch,
    desc: doc.desc,
    owner: doc.owner,
    engineer: doc.engineer,
    levelOfCare: doc.levelOfCare,
    status: doc.status,
    statusDate: doc.statusDate.toISOString().split('T')[0],
    platforms: doc.platforms,
    designDescDocLoc: doc.designDescDocLoc,
    descDocLoc: doc.descDocLoc,
    vvProcLoc: doc.vvProcLoc,
    vvResultsLoc: doc.vvResultsLoc,
    versionControl: doc.versionControl,
    versionControlLoc: doc.versionControlLoc,
    previous: doc.previous ? doc.previous.toHexString() : undefined,
    comment: doc.comment,
  };
}

// Convert Web API data to DB Model
function toModel(data: webapi.Software, doc?: Software): Software {
  if (!doc) {
    doc = new Software();
  }
  if (!isEqual(doc.swName, data.swName)) {
    doc.swName = data.swName;
  }
  if (!isEqual(doc.desc, data.desc)) {
    doc.desc = data.desc;
  }
  if (!isEqual(doc.branch, data.branch)) {
    doc.branch = data.branch;
  }
  if (!isEqual(doc.version, data.version)) {
    doc.version = data.version;
  }
  if (!isEqual(doc.owner, data.owner)) {
    doc.owner = data.owner;
  }
  if (!isEqual(doc.engineer, data.engineer)) {
    doc.engineer = data.engineer;
  }
  if (!isEqual(doc.levelOfCare, data.levelOfCare)) {
    doc.levelOfCare = data.levelOfCare;
  }
  if (!isEqual(doc.status, data.status)) {
    doc.status = data.status;
  }
  if (!doc.statusDate || doc.statusDate.getTime() !== Date.parse(data.statusDate)) {
    doc.statusDate = new Date(data.statusDate);
  }
  if (!isEqual(doc.platforms, data.platforms)) {
    doc.platforms = data.platforms;
  }
  if (!isEqual(doc.descDocLoc, data.descDocLoc)) {
    doc.descDocLoc = data.descDocLoc;
  }
  if (!isEqual(doc.designDescDocLoc, data.designDescDocLoc)) {
    doc.designDescDocLoc = data.designDescDocLoc;
  }
  if (!isEqual(doc.vvProcLoc, data.vvProcLoc)) {
    doc.vvProcLoc = data.vvProcLoc;
  }
  if (!isEqual(doc.vvResultsLoc, data.vvResultsLoc)) {
    doc.vvResultsLoc = data.vvResultsLoc;
  }
  if (!isEqual(doc.versionControl, data.versionControl)) {
    doc.versionControl = data.versionControl;
  }
  if (!isEqual(doc.versionControlLoc, data.versionControlLoc)) {
    doc.versionControlLoc = data.versionControlLoc;
  }
  if (data.previous) {
    if (!doc.previous || !doc.previous.equals(data.previous)) {
      doc.previous = models.ObjectId(data.previous);
    }
  } else if (doc.previous) {
    doc.previous = undefined;
  }
  if (!isEqual(doc.comment, data.comment)) {
    doc.comment = data.comment;
  }
  return doc;
}

// Create a new record in the backend storage
async function createDoc(user: string, req: express.Request, res: express.Response) {
  const role = auth.formatRole(auth.RoleScheme.USR, user);
  const doc = await toModel(req.body).saveWithHistory(role);
  debug('Created Software: ' + doc._id + ' as ' + user);
  res.location(`${res.locals.basePath || ''}/api/v1/swdb/${doc.id}`);
  res.status(201).json(toWebAPI(doc));
}

/**
 * createDocByRecord - crates a new record given a single sw record
 *
 * @param user The user making the request (String)
 * @param req The requested sw record to save
 */
// async function createDocByRecord(user: string, req: express.Request) {
//   const doc = new Software(req);

//   try {
//     await doc.saveWithHistory(auth.formatRole('USR', user));
//     debug('Created sw ' + doc._id + ' as ' + user);
//   } catch (err) {
//       debug('Error creating sw ' + doc._id + ': ' + err);
//   }
// }

async function getDocs(req: express.Request, res: express.Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    // return all items
    const docs = await Software.find().exec();
    res.json(docs.map(toWebAPI));
    return;
  }
  // return specified item
  const doc = await Software.findById(id).exec();
  if (!doc) {
    throw new RequestError('Software not found', NOT_FOUND);
  }
  res.json(toWebAPI(doc));
}

/**
 * getHist method
 *
 * This function uses the id found in the URL, and query terms to return a JSON array of history
 * items relevant to the id presented via the express.Response.send() method.
 *
 * @params req The express Request object
 * @params res The express Response object
 */
async function getHist(req: express.Request, res: express.Response): Promise<void> {
  const id = req.params.id ? String(req.params.id) : null;
  if (!id) {
    throw new Error('Search ID must be provided');
  }
  // get query terms and set defaults, if needed
  let limit = Number(req.query.limit);
  if (Number.isNaN(limit) || limit < 1) {
    limit = 5;
  }
  let skip = Number(req.query.skip);
  if (Number.isNaN(skip) || skip < 0) {
    skip = 0;
  }
  debug(`Find Software history for ${id} with limit: ${limit}, skip: ${skip}`);
  const updates = await history.Update.find({ rid: models.ObjectId(id) }).sort({at: -1}).limit(limit).skip(skip).exec();
  debug(`Found Software history with length: ${updates.length}`);
  res.json(updates);
}

async function updateDoc(user: string, doc: Software, req: express.Request, res: express.Response) {
  const role = auth.formatRole(auth.RoleScheme.USR, user);
  doc = await toModel(req.body, doc).saveWithHistory(role);
  debug(`Updated Software: ${doc._id} as ${user}`);
  res.location(`${res.locals.basePath || ''}/api/v1/swdb/${doc.id}`);
  res.json(toWebAPI(doc));
}

// return array of records given an array of ids
async function getList(req: express.Request, res: express.Response) {
  const objIds: string[] = [];
  if (Array.isArray(req.body)) {
    objIds.push(...req.body.map(String));
  }

  const docs = await Software.find({ _id: { $in: objIds } }).exec();
  const results: {[key: string]: {swName: string, version: string, branch: string}} = {};
  for (const doc of docs) {
    results[doc.id] = {
      swName: doc.swName,
      version: doc.version || '',
      branch: doc.branch || '',
    };
  }
  res.json(results);
}


// function deleteDoc(req: express.Request, res: express.Response, next: express.NextFunction) {
//   const id = req.params.id;

//   // mongoose does not error if deleting something that does not exist
//   Software.findOne({ _id: id }, (err: Error, doc: any) => {
//     if (doc) {
//       Software.remove({ _id: id }, (rmerr: Error) => {
//         if (!rmerr) {
//           res.end();
//         }
//       });
//     } else {
//       return next(err);
//     }
//   });
// }

// for get history requests
router.get('/api/v1/swdb/hist/:id([a-fA-F\\d]{24})', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/hist/:id request');
  await getHist(req, res);
}));

// for get requests that are specific
router.get('/api/v1/swdb/:id([a-fA-F\\d]{24})', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/:id request');
  await getDocs(req, res);
}));

// for get requests that are not specific return all
router.get('/api/v1/swdb', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb request');
  await getDocs(req, res);
}));

// handle incoming post requests
router.post('/api/v1/swdb', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('POST /api/v1/swdb request');

  const username = auth.getUsername(req);
  if (!username) {
    res.status(500).send('Ensure authenticated failed');
    return;
  }

  // Do validation for  new records
  await checkNewSoftware(req);

  const result = validationResult(req, legacy.validationErrorFormatter);
  if (!result.isEmpty()) {
    debug('validation result: ' + JSON.stringify(result.array()));
    res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
    return;
  }

  const dateObj = new Date(req.body.statusDate);
  req.body.statusDate = dateObj;

  await createDoc(username, req, res);
}));

// for get list of records requests
router.post('/api/v1/swdb/list', catchAll(async (req, res) => {
  debug('POST /api/v1/swdb/list request');
  await getList(req, res);
}));

// handle incoming put requests for update
router.put('/api/v1/swdb/:id([a-fA-F\\d]{24})', auth.ensureAuthenticated, catchAll(async (req, res) => {
  const id = req.params.id ? String(req.params.id) : null;
  debug('PUT /api/v1/swdb/%s request', id);

  if (!id) {
    throw new RequestError('Record not found', NOT_FOUND);
  }
  const doc = await Software.findById(id);
  if (!doc) {
    throw new RequestError('Record not found', NOT_FOUND);
  }

  const username = auth.getUsername(req);
  if (!username) {
    res.status(500).send('Ensure authenticated failed');
    return;
  }

  await checkNewSoftware(req);

  const result = validationResult(req, legacy.validationErrorFormatter);
  if (!result.isEmpty()) {
    res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
    return;
  }

  // setup an array of validations to perfrom
  // save the results in wfResultsArr, and errors in errors.
  const wfResultArr = await Promise.all([
    CustomValidators.swNoVerBranchChgIfStatusRdyInstall(req),
    CustomValidators.noSwStateChgIfReferringInst(req),
  ]);

  const errors = wfResultArr.reduce<IValResult[]>((p, r, idx) => {
    if (r.error) {
      p.push(r);
    }
    debug('wfValArr[' + idx + ']: ' + JSON.stringify(r));
    return p;
  }, []);

  debug('Workflow validation results :' + JSON.stringify(wfResultArr));

  if (errors.length > 0) {
    debug('Workflow validation errors ' + JSON.stringify(errors));
    res.status(400).send('Worklow validation errors: ' + JSON.stringify(errors[0].data));
    return;
  }

  await updateDoc(username, doc, req, res);
}));
