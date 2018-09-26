/**
 * Route handlers for software API.
 */
import * as Debug from 'debug';
import * as express from 'express';

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
  checkUpdateSoftware,
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
function toWebAPI(doc: ISoftware): webapi.ISwdb {
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
    previous: doc.previous,
    comment: doc.comment,
  };
}


// Create a new record in the backend storage
async function createDoc(user: string, req: express.Request, res: express.Response) {
  const doc = await new Software(req.body).saveWithHistory(auth.formatRole(auth.RoleScheme.USR, user));
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

async function updateDoc(user: string, req: express.Request, res: express.Response) {
  const id = req.params.id ? String(req.params.id) : null;
  if (!id) {
    throw new Error('Record not found');
            }
  const doc = await Software.findById(id);
  if (!doc) {
    throw new Error('Record not found');
  }

  doc.schema.eachPath((path) => {
    if ([ '_id', 'history' ].includes(path)) {
      return;
    }
    if (req.body[path] !== undefined) {
      // watch for incoming deletes (??)
      if (req.body[path] === '') {
        if (doc.get(path)) {
          debug(`Remove Software path: ${path}`);
          doc.set(path, undefined);
        }
        return;
      }
      debug(`Updated Software path: ${path}, value: '${req.body[path]}'`);
      doc.set(path, req.body[path]);
    }
  });

  await doc.saveWithHistory(auth.formatRole(auth.RoleScheme.USR, user));
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
router.get('/api/v1/swdb/hist/:id', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/hist/:id request');
  await getHist(req, res);
}));

// for get requests that are specific
router.get('/api/v1/swdb/:id', catchAll(async (req, res) => {
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

  // Do validation for  new records
  await checkNewSoftware(req);

  const result = validationResult(req, legacy.validationErrorFormatter);
  if (!result.isEmpty()) {
    debug('validation result: ' + JSON.stringify(result.array()));
    res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
    return;
  }

  const username = auth.getUsername(req);
  if (!username) {
    res.status(500).send('Ensure authenticated failed');
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
router.put('/api/v1/swdb/:id', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('PUT /api/v1/swdb/:id request');

  await checkUpdateSoftware(req);

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

  const username = auth.getUsername(req);
  if (!username) {
    res.status(500).send('Ensure authenticated failed');
    return;
  }

  await updateDoc(username, req, res);
}));


// handle incoming patch requests for update
router.patch('/api/v1/swdb/:id', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('PATCH /api/v1/swdb/:id request');

  await checkUpdateSoftware(req);

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

  const username = auth.getUsername(req);
  if (!username) {
    res.status(500).send('Ensure authenticated failed');
    return;
  }

  await updateDoc(username, req, res);
}));
