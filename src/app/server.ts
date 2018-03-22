'use strict';
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import dbg = require('debug');
import express = require('express');
import expressSession = require('express-session');
import expressValidator = require('express-validator');
import fs = require('fs');
import https = require('https');
import mongoose = require('mongoose');
import morgan = require('morgan');
import path = require('path');
import util = require('util');
import auth = require('./shared/auth');
import cfauth = require('./shared/forg-auth');
import forgapi = require('./shared/forgapi');
import * as mockforgapi from '../apptest/shared/mock-forgapi';
import CommonTools = require('./lib/CommonTools');
import Be = require('./lib/Db');
import InstBe = require('./lib/instDb');
import instTools = require('./lib/instLib');
import tools = require('./lib/swdblib');
import customValidators = require('./lib/validators');
import cJSON = require('circular-json');
import validate = require('validate.js');

const debug = dbg('swdb:server');
const app: any = express();
const be = new Be.Db();
const instBe = new InstBe.InstDb();
const ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();

// allow access to static files
app.use(express.static(__dirname + '/../public'));
debug('public using ' + __dirname + '/../public');

// use JSON for data
app.use(bodyParser.json());

// Get the CORS params from rc and add to stack
app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.header('Access-Control-Allow-Origin', props.CORS.origin);
  res.header('Access-Control-Allow-Methods', props.CORS.methods);
  res.header('Access-Control-Allow-Headers', props.CORS.headers);
  next();
});

debug('props at startup: ' + JSON.stringify(props, null, 2));

let cfAuthProvider: any;
// check whether we are testing and set the auth
if (props.test.testing === 'true') {
  debug('TEST mode is active!');
  let gdata: forgapi.Group[] = ctools.getForgGroupsTestFile();
  const forgClient = mockforgapi.MockClient.getInstance();
  // debug('loading mock forg groups for with: ' + JSON.stringify(gdata, null, 2));
  forgClient.addGroup(gdata);
  let udata: forgapi.User[] = ctools.getForgUsersTestFile();
  // debug('loading mock forg users for with: ' + JSON.stringify(udata, null, 2));
  forgClient.addUser(udata);

  cfAuthProvider = new cfauth.DevForgBasicProvider(forgClient, {});
} else {
  debug('Normal authentication mode is active!');
  const forgClient = new forgapi.Client({
    url: String(props.auth.forgapi.url),
    agentOptions: props.auth.forgapi.agentOptions || {},
  });
  cfAuthProvider = new cfauth.ForgCasProvider(forgClient, {
    casUrl: String(props.auth.cas.cas_url),
    casServiceUrl: String(props.auth.cas.service_url),
    casAppendPath: props.auth.cas.append_path === true ? true : false,
    casVersion: props.auth.cas.version ? String(props.auth.cas.version) : undefined,
  });
}

auth.setProvider(cfAuthProvider);

app.use(cookieParser());
app.use(expressSession({secret: '1234567890',
  resave: false,
  saveUninitialized: false,
}));

app.use(cfAuthProvider.initialize());

// Set custom validators in expressValidator
app.use(expressValidator(customValidators.CustomValidators.vals));

// start the server
app.listen(props.webPort, function() {
  debug('listening on port ' + props.webPort);
});

// handle incoming get requests
app.get('/', function(req: express.Request, res: express.Response) {
  debug('GET / request');
  res.sendFile('index.html', {root: path.join(__dirname, '../public/swdb-fe/')});
});

app.get('/login', cfAuthProvider.authenticate(), function(req: express.Request, res: express.Response) {
  debug('GET /login request');
  if (req.query.bounce) {
    res.redirect(req.query.bounce);
    return;
  }
  res.redirect('/');
});

// logoff
app.get('/logout', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /logout request');
  req.session!.destroy((err: Error) => { next(err); });
  res.clearCookie('connect.sid', {path: '/'});

  delete req.query.ticket;
  cfAuthProvider.logout(req);
  res.redirect(props.auth.cas.cas_url + '/logout');
});

// for get requests that are not specific return all
app.get('/api/v1/swdb/user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/user request');
  res.json({ user: auth.getProvider().getUser(req) });
  debug('sending user data ' + JSON.stringify({ user: auth.getProvider().getUser(req) }, null, 2));
});

// for get requests that are not specific return all
app.get('/api/v1/swdb/config', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  // update props and send config
  debug('GET /api/v1/swdb/config request');
  res.send(JSON.stringify(props));
});

// for get slot requests
app.get('/api/v1/swdb/slot', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/slot request');
  instTools.InstLib.getSlot(req, res, next);
});

// for get forg groups requests
app.get('/api/v1/swdb/forgGroups', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/forgGroups request');
  tools.SwdbLib.getForgGroups(req, res, next);
});

// for get forg areas requests
app.get('/api/v1/swdb/forgAreas', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/forgAreas request');
  tools.SwdbLib.getForgAreas(req, res, next);
});

// for get forg users requests
app.get('/api/v1/swdb/forgUsers', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/forgUsers request');
  tools.SwdbLib.getForgUsers(req, res, next);
});

// for get history requests
app.get('/api/v1/swdb/hist/:id', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/hist/* request');
  be.getHist(req, res, next);
});
// for get requests that are specific
app.get('/api/v1/swdb/:id', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/* request');
  be.getDocs(req, res, next);
});
// for get requests that are not specific return all
app.get('/api/v1/swdb', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/swdb/* request');
  be.getDocs(req, res, next);
});

// handle incoming post requests
app.post('/api/v1/swdb', auth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('POST /api/v1/swdb request');
  // Do validation for  new records

  tools.SwdbLib.newValidation(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      debug('validation result: ' + JSON.stringify(result.array()));
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      be.createDoc(auth.getUsername(req), req, res, next);
    }
  });
});

// for get list of records requests
app.post('/api/v1/swdb/list', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('POST /api/v1/swdb/list request');
  be.getList(req, res, next);
});

// handle incoming put requests for update
app.put('/api/v1/swdb/:id', auth.ensureAuthenticated,
  async function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('PUT /api/v1/swdb/:id request');

  tools.SwdbLib.updateValidation(req);
  tools.SwdbLib.updateSanitization(req);
  req.getValidationResult().then(async function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      let wfResults =
        await customValidators.CustomValidators.swUpdateWorkflowValidation(req, be);
      if (wfResults.error) {
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(wfResults.data));
        return;
      } else {
        be.updateDoc(auth.getUsername(req), req, res, next);
      }
    }
  });
});


// handle incoming patch requests for update
app.patch('/api/v1/swdb/:id', auth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('PATCH /api/v1/swdb/:id request');

  tools.SwdbLib.updateValidation(req);
  tools.SwdbLib.updateSanitization(req);
  req.getValidationResult().then(async function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      let wfResults =
        await customValidators.CustomValidators.swUpdateWorkflowValidation(req, be);
      if (wfResults.error) {
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(wfResults.data));
        return;
      } else {
        be.updateDoc(auth.getUsername(req), req, res, next);
      }
    }
  });

});


// Handle installation requests
// for get requests that are not specific return all
app.get('/api/v1/inst/hist/:id', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/inst/hist/:id request');
  instBe.getHist(req, res, next);
});
// for get requests that are specific
app.get('/api/v1/inst/:id', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/inst/:id request');
  instBe.getDocs(req, res, next);
});
// for get requests that are not specific return all
app.get('/api/v1/inst', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('GET /api/v1/inst/:id request');
  instBe.getDocs(req, res, next);
});

// handle incoming installation post requests
app.post('/api/v1/inst', auth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {

  debug('POST /api/v1/inst request');
  // Do validation for  new records
  instTools.InstLib.newValidation(req);

  req.getValidationResult().then(async function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      let wfResults =
        await customValidators.CustomValidators.wfRule3(req);
      if (wfResults.error) {
        debug('Workflow validation errors ' + JSON.stringify(wfResults));
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(wfResults.data));
        return;
      } else {
        debug('POST /api/v1/inst calling create...');
        instBe.createDoc(auth.getUsername(req), req, res, next);
      }
    }
  });
});

// handle incoming put requests for installation update
app.put('/api/v1/inst/:id', auth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('PUT /api/v1/inst/:id request');
  // Do validation for installation updates
  instTools.InstLib.updateValidation(req);
  instTools.InstLib.updateSanitization(req);
  req.getValidationResult().then(async function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      // setup an array of validations to perfrom
      // save the results in wfResultsArr, and errors in errors.
      let wfValArr = [customValidators.CustomValidators.instUpdateWorkflowValidation,
        customValidators.CustomValidators.wfRule3];

      let errors = [];
      let wfResultArr = await Promise.all(wfValArr.map(async function (item, idx, arr) {
        let r = await item(req);
        if (r.error) {
          errors.push(r);
        }
        debug('wfValArr[' + idx + ']: ' + JSON.stringify(r));
        return r;
      }),
    );

      debug('Workflow validation results :' + JSON.stringify(wfResultArr));

      // let wfResults =
      //   await customValidators.CustomValidators.instUpdateWorkflowValidation(req);
      if (errors.length > 0) {
        debug('Workflow validation errors ' + JSON.stringify(errors));
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(errors));
        return;
      } else {
        instBe.updateDoc(auth.getUsername(req), req, res, next);
      }
    }
  });
});

// handle incoming put requests for installation update
app.patch('/api/v1/inst/:id', auth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('PATCH /api/v1/inst/:id request');
  // Do validation for installation updates
  instTools.InstLib.updateValidation(req);
  instTools.InstLib.updateSanitization(req);
  req.getValidationResult().then(async function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      // setup an array of validations to perfrom
      // save the results in wfResultsArr, and errors in errors.
      let wfValArr = [customValidators.CustomValidators.instUpdateWorkflowValidation,
      customValidators.CustomValidators.wfRule3];

      let errors = [];
      let wfResultArr = await Promise.all(wfValArr.map(async function (item, idx, arr) {
        let r = await item(req);
        if (r.error) {
          errors.push(r);
        }
        debug('wfValArr[' + idx + ']: ' + JSON.stringify(r));
        return r;
      }),
      );

      debug('Workflow validation results :' + JSON.stringify(wfResultArr));

      // let wfResults =
      //   await customValidators.CustomValidators.instUpdateWorkflowValidation(req);
      if (errors.length > 0) {
        debug('Workflow validation errors ' + JSON.stringify(errors));
        res.status(400).send('Worklow validation errors: ' + JSON.stringify(errors));
        return;
      } else {
        instBe.updateDoc(auth.getUsername(req), req, res, next);
      }
    }
  });
});

// handle incoming delete requests
// app.delete('/swdbserv/v1*', function(req, res, next) {
//   be.deleteDoc(req, res, next);
// });

// handle errors
app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === 'ValidationError') {
    // catch mongo validation errors
    res.status(400);
    res.send(err);
  } else {
    res.status(500);
    res.send(err.message || 'An error ocurred');
  }
});

module.exports = app;
