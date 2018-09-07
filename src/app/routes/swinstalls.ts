/**
 * Route handlers for software installations API.
 */
import * as Debug from 'debug';
import * as express from 'express';

import * as auth from '../shared/auth';
import * as history from '../shared/history';
import * as models from '../shared/models';

import * as validation from '../lib/validation';
import * as customValidators from '../lib/validators';

import {
  ISWInstall,
  SWInstall,
} from '../models/swinstall';

const debug = Debug('swdb:routes:api-software');

const router = express.Router();

export function getRouter(opts?: {}): express.Router {
  return router;
}


// Create a new record in the backend storage
async function createDoc(user: string, req: express.Request, res: express.Response, next: express.NextFunction) {
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

function getDocs(req: express.Request, res: express.Response, next: express.NextFunction) {
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
      vvApprovalDate: doc.vvApprovalDate ? (doc.vvApprovalDate.getUTCMonth() + 1).toString() + '/' +
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
async function getHist(req: express.Request, res: express.Response, next: express.NextFunction) {

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
}

async function updateDoc(user: string, req: express.Request, res: express.Response, next: express.NextFunction) {
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
router.get('/api/v1/inst/hist/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  debug('GET /api/v1/inst/hist/:id request');
  getHist(req, res, next);
});

// for get requests that are specific
router.get('/api/v1/inst/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  debug('GET /api/v1/inst/:id request');
  getDocs(req, res, next);
});

// for get requests that are not specific return all
router.get('/api/v1/inst', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  debug('GET /api/v1/inst/:id request');
  getDocs(req, res, next);
});

// handle incoming installation post requests
router.post('/api/v1/inst', auth.ensureAuthenticated, (req, res, next) => {

  debug('POST /api/v1/inst request');
  // Do validation for  new records
  validation.checkNewSWInstall(req);

  req.getValidationResult().then(async (result) => {
    if (!result.isEmpty()) {
      debug('Validation errors: ' + JSON.stringify(result.array()));
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      const wfResults: customValidators.IValResult =
        await customValidators.CustomValidators.noInstSwUnlessSwIsReadyForInstall(req);
      if (wfResults.error) {
        debug('Workflow validation errors ' + JSON.stringify(wfResults));
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(wfResults.data));
        return;
      } else {
        debug('POST /api/v1/inst calling create...');
        const username = auth.getUsername(req);
        if (!username) {
          res.status(500).send('Ensure authenticated failed');
          return;
        }
        createDoc(username, req, res, next);
      }
    }
  });
});

// handle incoming put requests for installation update
router.put('/api/v1/inst/:id', auth.ensureAuthenticated,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
  debug('PUT /api/v1/inst/:id request');
  // Do validation for installation updates
  validation.checkUpdateSWInstall(req);
  req.getValidationResult().then(async (result) => {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      // setup an array of validations to perfrom
      // save the results in wfResultsArr, and errors in errors.
      const wfValArr = [
        customValidators.CustomValidators.noInstSwChangeUnlessReadyForInstall,
        customValidators.CustomValidators.noInstSwUnlessSwIsReadyForInstall,
      ];

      const errors: customValidators.IValResult[] = [];
      const wfResultArr = await Promise.all(wfValArr.map(async (item, idx, arr) => {
        const r = await item(req);
        if (r.error) {
          errors.push(r);
        }
        debug('wfValArr[' + idx + ']: ' + JSON.stringify(r));
        return r;
      }),
    );

      debug('Workflow validation results :' + JSON.stringify(wfResultArr));

      if (errors.length > 0) {
        debug('Workflow validation errors ' + JSON.stringify(errors));
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(errors[0].data));
        return;
      } else {
        const username = auth.getUsername(req);
        if (!username) {
          res.status(500).send('Ensure authenticated failed');
          return;
        }
        updateDoc(username, req, res, next);
      }
    }
  });
});

// handle incoming put requests for installation update
router.patch('/api/v1/inst/:id', auth.ensureAuthenticated, (req, res, next) => {
  debug('PATCH /api/v1/inst/:id request');
  // Do validation for installation updates
  validation.checkUpdateSWInstall(req);
  req.getValidationResult().then(async (result) => {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      // setup an array of validations to perfrom
      // save the results in wfResultsArr, and errors in errors.
      const wfValArr = [
        customValidators.CustomValidators.noInstSwChangeUnlessReadyForInstall,
        customValidators.CustomValidators.noInstSwUnlessSwIsReadyForInstall,
      ];

      const errors: customValidators.IValResult[] = [];
      const wfResultArr = await Promise.all(
        wfValArr.map(async (item, idx, arr) => {
          const r = await item(req);
          if (r.error) {
            errors.push(r);
          }
          debug('wfValArr[' + idx + ']: ' + JSON.stringify(r));
          return r;
        }),
      );

      debug('Workflow validation results :' + JSON.stringify(wfResultArr));

      if (errors.length > 0) {
        debug('Workflow validation errors ' + JSON.stringify(errors));
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(errors[0].data));
        return;
      } else {
        const username = auth.getUsername(req);
        if (!username) {
          res.status(500).send('Ensure authenticated failed');
          return;
        }
        updateDoc(username, req, res, next);
      }
    }
  });
});

// handle incoming delete requests
// router.delete('/swdbserv/v1*', function(req, res, next) {
//   be.deleteDoc(req, res, next);
// });
