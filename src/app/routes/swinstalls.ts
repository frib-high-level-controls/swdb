/**
 * Route handlers for software installations API.
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
  checkNewSWInstall,
  checkUpdateSWInstall,
} from '../lib/validation';

import {
  catchAll,
  HttpStatus,
  RequestError,
  validationResult,
} from '../shared/handlers';

import {
  ISWInstall,
  SWInstall,
} from '../models/swinstall';


const NOT_FOUND = HttpStatus.NOT_FOUND;

const debug = Debug('swdb:routes:api-software');

const router = express.Router();

export function getRouter(opts?: {}): express.Router {
  return router;
}


// Convert DB Model to Web API
function toWebAPI(doc: ISWInstall): webapi.Inst {
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
    vvApprovalDate: doc.vvApprovalDate ? (doc.vvApprovalDate.getUTCMonth() + 1).toString() + '/' +
      doc.vvApprovalDate.getUTCDate() + '/' + doc.vvApprovalDate.getUTCFullYear() : undefined,
    drrs: doc.drrs,
  };
}

// Create a new record in the backend storage
async function createDoc(user: string, req: express.Request, res: express.Response): Promise<void> {
  const doc = await new SWInstall(req.body).saveWithHistory(auth.formatRole(auth.RoleScheme.USR, user));
  debug('Created SWInstall: ' + doc._id + ' as ' + user);
  res.location(`${res.locals.basePath || ''}/api/v1/inst/${doc.id}`);
  res.status(201).json(toWebAPI(doc));
}

/**
 * createDocByRecord - crates a new record given a single sw record
 *
 * @param user The user making the request (String)
 * @param req The requested sw record to save
 */
// async function createDocByRecord(user: string, req: express.Request) {
//   const doc = new SWInstall(req);

//   try {
//     await doc.saveWithHistory(auth.formatRole('USR', user));
//     debug('Created installation ' + doc._id + ' as ' + user);
//   } catch (err) {
//       debug('Error creating installation ' + doc._id + ': ' + err);
//   }
// }

async function getDocs(req: express.Request, res: express.Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    // return all items
    const docs = await SWInstall.find().exec();
    res.json(docs.map(toWebAPI));
    return;
  }
  // return specified item
  const doc = await SWInstall.findById(id).exec();
  if (!doc) {
    throw new RequestError('Software Install not found', NOT_FOUND);
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
  debug(`Find SWInstall history for ${id} with limit: ${limit}, 'skip: ${skip}`);
  const updates = await history.Update.find({ rid: models.ObjectId(id) }).sort({at: -1}).limit(limit).skip(skip).exec();
  debug(`Found SWInstall history with length: ${updates.length}`);
  res.json(updates);
}

async function updateDoc(user: string, req: express.Request, res: express.Response): Promise<void> {
  const id = req.params.id ? String(req.params.id) : null;
  if (!id) {
    throw new Error('Record not found');
  }
  const doc = await SWInstall.findById(id).exec();
  if (!doc) {
    throw new Error('Record not found');
  }

  doc.schema.eachPath((path) => {
    if ([ '_id', 'history' ].includes(path)) {
      return;
    }
    if (req.body[path] !== undefined) {
      debug(`Updated SWInstall path: ${path}, value: '${req.body[path]}'`);
      doc.set(path, req.body[path]);
    }
  });

  await doc.saveWithHistory(auth.formatRole(auth.RoleScheme.USR, user));
  debug(`Updated Software: ${doc._id} as ${user}`);
  res.location(`${res.locals.basePath || ''}/api/v1/inst/${doc.id}`);
  res.json(toWebAPI(doc));
}


// function deleteDoc(req: express.Request, res: express.Response, next: express.NextFunction) {
//   const id = req.params.id;

//   // mongoose does not error if deleting something that does not exist
//   SWInstall.findOne({ _id: id }, (err, doc) => {
//     if (doc) {
//       exports.instDoc.remove({ _id: id }, (rmerr: Error) => {
//         if (!rmerr) {
//           res.end();
//         } else {
//           next(new Error('Record not found'));
//         }
//       });
//     } else {
//       return next(err);
//     }
//   });
// }



// Handle installation requests
// for get requests that are not specific return all
router.get('/api/v1/inst/hist/:id', catchAll(async (req, res) => {
  debug('GET /api/v1/inst/hist/:id request');
  await getHist(req, res);
}));

// for get requests that are specific
router.get('/api/v1/inst/:id', catchAll(async (req, res) => {
  debug('GET /api/v1/inst/:id request');
  await getDocs(req, res);
}));

// for get requests that are not specific return all
router.get('/api/v1/inst', catchAll( async (req, res) => {
  debug('GET /api/v1/inst request');
  await getDocs(req, res);
}));

// handle incoming installation post requests
router.post('/api/v1/inst', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('POST /api/v1/inst request');

  // Do validation for  new records
  await checkNewSWInstall(req);

  const result = validationResult(req, legacy.validationErrorFormatter);
  if (!result.isEmpty()) {
    debug('Validation errors: ' + JSON.stringify(result.array()));
    res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
    return;
  }

  const wfResults = await CustomValidators.noInstSwUnlessSwIsReadyForInstall(req);
  if (wfResults.error) {
    debug('Workflow validation errors ' + JSON.stringify(wfResults));
    res.status(400).send('Worklow validation errors: ' + JSON.stringify(wfResults.data));
    return;
  }

  const username = auth.getUsername(req);
  if (!username) {
    res.status(500).send('Ensure authenticated failed');
    return;
  }

  await createDoc(username, req, res);
}));

// handle incoming put requests for installation update
router.put('/api/v1/inst/:id', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('PUT /api/v1/inst/:id request');

  // Do validation for installation updates
  await checkUpdateSWInstall(req);

  const result = validationResult(req, legacy.validationErrorFormatter);
  if (!result.isEmpty()) {
    res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
    return;
  }

  // setup an array of validations to perfrom
  // save the results in wfResultsArr, and errors in errors.
  const wfResultArr = await Promise.all([
    CustomValidators.noInstSwChangeUnlessReadyForInstall(req),
    CustomValidators.noInstSwUnlessSwIsReadyForInstall(req),
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
    debug('Workflow validation errors: ' + JSON.stringify(errors));
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

// handle incoming put requests for installation update
router.patch('/api/v1/inst/:id', auth.ensureAuthenticated, catchAll(async (req, res) => {
  debug('PATCH /api/v1/inst/:id request');

  // Do validation for installation updates
  await checkUpdateSWInstall(req);

  const result = validationResult(req, legacy.validationErrorFormatter);
  if (!result.isEmpty()) {
    res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
    return;
  }

  // setup an array of validations to perfrom
  const wfResultArr = await Promise.all([
    CustomValidators.noInstSwChangeUnlessReadyForInstall(req),
    CustomValidators.noInstSwUnlessSwIsReadyForInstall(req),
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

// handle incoming delete requests
// router.delete('/swdbserv/v1*', function(req, res, next) {
//   be.deleteDoc(req, res, next);
// });
