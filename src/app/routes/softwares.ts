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
  ensureAccepts,
  ensurePackage,
  HttpStatus,
  pkgErrorDetailFormatter,
  RequestError,
  validationResult,
} from '../shared/handlers';

import {
  ISoftware,
  Software,
} from '../models/software';

type Request = express.Request;
type Response = express.Response;

const CREATED = HttpStatus.CREATED;
const NOT_FOUND = HttpStatus.NOT_FOUND;
const BAD_REQUEST = HttpStatus.BAD_REQUEST;
const INTERNAL_SERVER_ERROR = HttpStatus.INTERNAL_SERVER_ERROR;


const debug = Debug('swdb:routes:api-software');

const router = express.Router();

export function getRouter(opts?: {}): express.Router {
  return router;
}

// Convert DB Model to Web API
function toWebAPI(doc: ISoftware): webapi.Software {
  return {
    _id: String(doc._id),
    name: doc.name,
    version: doc.version,
    branch: doc.branch,
    desc: doc.desc,
    owner: doc.owner,
    engineer: doc.engineer,
    levelOfCare: doc.levelOfCare,
    status: doc.status,
    statusDate: doc.statusDate.toISOString().split('T')[0],
    platforms: doc.platforms,
    designDocLoc: doc.designDocLoc,
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
  if (!isEqual(doc.name, data.name)) {
    doc.name = data.name;
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
  if (!isEqual(doc.designDocLoc, data.designDocLoc)) {
    doc.designDocLoc = data.designDocLoc;
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
async function createDoc(user: string, v2: boolean, req: Request, res: Response) {
  const role = auth.formatRole(auth.RoleScheme.USR, user);
  const doc = await toModel(v2 ? req.body.data : req.body).saveWithHistory(role);
  debug('Created Software: ' + doc._id + ' as ' + user);
  res.location(`${res.locals.basePath || ''}/api/v1/swdb/${doc.id}`);
  if (v2) {
    const pkg: webapi.Pkg<webapi.Software> = { data: toWebAPI(doc) };
    res.status(CREATED).json(pkg);
  } else {
    res.status(201).json(toWebAPI(doc));
  }
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

async function getDocs(v2: boolean, req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    // return all items
    const docs = await Software.find().exec();
    if (v2) {
      const pkg: webapi.Pkg<webapi.Software[]> = { data: docs.map(toWebAPI) };
      res.json(pkg);
    } else {
      res.json(docs.map(toWebAPI));
    }
    return;
  }
  // return specified item
  const doc = await Software.findById(id).exec();
  if (!doc) {
    throw new RequestError('Software not found', NOT_FOUND);
  }
  if (v2) {
    const pkg: webapi.Pkg<webapi.Software> = { data: toWebAPI(doc) };
    res.json(pkg);
  } else {
    res.json(toWebAPI(doc));
  }
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
async function getHist(v2: boolean, req: Request, res: Response): Promise<void> {
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
  if (v2) {
    const pkg: webapi.Pkg<webapi.Update[]> = {
      data: updates.map((update) => ({
        by: update.by,
        at: update.at.toISOString(),
        paths: update.paths.map((path) => ({
          name: path.name,
          value: path.value,
        })),
      })),
    };
    res.json(pkg);
  } else {
    res.json(updates);
  }
}

async function updateDoc(user: string, doc: Software, v2: boolean, req: Request, res: Response) {
  const role = auth.formatRole(auth.RoleScheme.USR, user);
  doc = await toModel(v2 ? req.body.data : req.body, doc).saveWithHistory(role);
  debug(`Updated Software: ${doc._id} as ${user}`);
  res.location(`${res.locals.basePath || ''}/api/v1/swdb/${doc.id}`);
  if (v2) {
    const pkg: webapi.Pkg<webapi.Software> = { data: toWebAPI(doc) };
    res.json(pkg);
  } else {
    res.json(toWebAPI(doc));
  }
}

// return array of records given an array of ids
async function getList(req: Request, res: Response) {
  const objIds: string[] = [];
  if (Array.isArray(req.body)) {
    objIds.push(...req.body.map(String));
  }

  const docs = await Software.find({ _id: { $in: objIds } }).exec();
  const results: {[key: string]: {name: string, version: string, branch: string}} = {};
  for (const doc of docs) {
    results[doc.id] = {
      name: doc.name,
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
  debug('GET /api/v1/swdb/hist/%s request', req.params.id);
  req.params.v = 'v1';
  return getSoftwareHistHandler(req, res);
}));

router.get('/api/v2/software/:id([a-fA-F\\d]{24})/history', ensureAccepts('json'), catchAll(async (req, res) => {
  debug('GET /api/v2/software/%s/history', req.params.id);
  req.params.v = 'v2';
  return getSoftwareHistHandler(req, res);
}));

const getSoftwareHistHandler = async (req: Request, res: Response) => {
  const v2 = req.params.v === 'v2';
  await getHist(v2, req, res);
};

// for get requests that are specific
router.get('/api/v1/swdb/:id([a-fA-F\\d]{24})', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/:id request');
  req.params.v = 'v1';
  return getSoftwareHandler(req, res);
}));

router.get('/api/v2/software/:id([a-fA-F\\d]{24})', ensureAccepts('json'), catchAll(async (req, res) => {
  debug('GET /api/v2/software/%s', req.params.id);
  req.params.v = 'v2';
  return getSoftwareHandler(req, res);
}));

const getSoftwareHandler = async (req: Request, res: Response) => {
  const v2 = req.params.v === 'v2';
  await getDocs(v2, req, res);
};

// for get requests that are not specific return all
router.get('/api/v1/swdb', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb request');
  req.params.v = 'v1';
  return getSoftwareListHandler(req, res);
}));

router.get('/api/v2/software', ensureAccepts('json'), catchAll(async (req, res) => {
  debug('GET /api/v2/software');
  req.params.v = 'v2';
  return getSoftwareListHandler(req, res);
}));

const getSoftwareListHandler = async (req: Request, res: Response) => {
  const v2 = req.params.v === 'v2';
  await getDocs(v2, req, res);
};

// handle incoming post requests for create
router.post('/api/v1/swdb', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('POST /api/v1/swdb request');
  req.params.v = 'v1';
  return postSoftwareHandler(req, res);
}));

// tslint:disable:max-line-length
router.post('/api/v2/software', ensureAccepts('json'), ensurePackage(), auth.ensureAuthc(), catchAll(async (req, res) => {
  debug('POST /api/v2/software');
  req.params.v = 'v2';
  return postSoftwareHandler(req, res);
}));

const postSoftwareHandler = async (req: Request, res: Response) => {
  const v2 = req.params.v === 'v2';

  const username = auth.getUsername(req);
  if (!username) {
    if (v2) {
      throw new RequestError('No username on authenticated request', INTERNAL_SERVER_ERROR);
    } else {
      res.status(500).send('Ensure authenticated failed');
      return;
    }
  }

  // Do validation for  new records
  await checkNewSoftware(v2, req);

  if (v2) {
    // TODO: replace with validateAndThrow()
    const result = validationResult(req, pkgErrorDetailFormatter);
    if (!result.isEmpty()) {
      const perror: webapi.PkgError = {
        code: BAD_REQUEST,
        message: 'Software Validation Error',
        errors: result.array(),
      };
      throw new RequestError(perror.message, perror.code, perror);
    }
  } else {
    const result = validationResult(req, legacy.validationErrorFormatter);
    if (!result.isEmpty()) {
      debug('validation result: ' + JSON.stringify(result.array()));
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    }
  }

  const dateObj = new Date(req.body.statusDate);
  req.body.statusDate = dateObj; // TODO: is this required?

  await createDoc(username, v2, req, res);
};

// for get list of records requests (not supported in v2)
router.post('/api/v1/swdb/list', catchAll(async (req, res) => {
  debug('POST /api/v1/swdb/list request');
  await getList(req, res);
}));

// handle incoming put requests for update
router.put('/api/v1/swdb/:id([a-fA-F\\d]{24})', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('PUT /api/v1/swdb/%s', req.params.id);
  req.params.v = 'v1';
  return putSoftwareHandler(req, res);
}));

// tslint:disable:max-line-length
router.put('/api/v2/software/:id([a-fA-F\\d]{24})', ensureAccepts('json'), ensurePackage(), auth.ensureAuthc(), catchAll(async (req, res) => {
  debug('PUT /api/v2/software/%s request', req.params.id);
  req.params.v = 'v2';
  return putSoftwareHandler(req, res);
}));

const putSoftwareHandler = async (req: Request, res: Response) => {
  const v2 = req.params.v === 'v2';
  const id = req.params.id ? String(req.params.id) : null;

  if (!id) {
    throw new RequestError('Record not found', NOT_FOUND);
  }
  const doc = await Software.findById(id);
  if (!doc) {
    throw new RequestError('Record not found', NOT_FOUND);
  }

  const username = auth.getUsername(req);
  if (!username) {
    if (v2) {
      throw new RequestError('No username on authenticated request', INTERNAL_SERVER_ERROR);
    } else {
      res.status(500).send('Ensure authenticated failed');
      return;
    }
  }

  await checkNewSoftware(v2, req);

  if (v2) {
    // TODO: replace with validateAndThrow()
    const result = validationResult(req, pkgErrorDetailFormatter);
    if (!result.isEmpty()) {
      const perror: webapi.PkgError = {
        code: BAD_REQUEST,
        message: 'Software Validation Error',
        errors: result.array(),
      };
      throw new RequestError(perror.message, perror.code, perror);
    }
  } else {
    const result = validationResult(req, legacy.validationErrorFormatter);
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    }
  }

  // setup an array of validations to perfrom
  // save the results in wfResultsArr, and errors in errors.
  const wfResultArr = await Promise.all([
    CustomValidators.swNoVerBranchChgIfStatusRdyInstall(v2, req),
    CustomValidators.noSwStateChgIfReferringInst(v2, req),
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
    if (v2) {
      const perror: webapi.PkgError = {
        code: BAD_REQUEST,
        message: 'Workflow Validation Error',
        errors: errors.map((v) => ({
          reason: 'WorkflowValidationError',
          message: v.data,
          location: 'data', // TODO: more specific location
        })),
      };
      throw new RequestError(perror.message, perror.code, perror);
    } else {
      res.status(400).send('Worklow validation errors: ' + JSON.stringify(errors[0].data));
      return;
    }
  }

  await updateDoc(username, doc, v2, req, res);
};
