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
import CommonTools = require('./lib/CommonTools');
import Be = require('./lib/Db');
import InstBe = require('./lib/instDb');
import instTools = require('./lib/instLib');
import tools = require('./lib/swdblib');
import cJSON = require('circular-json');
import validate = require('validate.js');
// import casAuth = require('/home/deployer/template-webapp/src/app/shared/auth');

const debug = dbg('swdb:server');
const app: any = express();
const be = new Be.Db();
const instBe = new InstBe.InstDb();
const ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();

// // for https functionality
// let privateKey  = fs.readFileSync(props.sslKey, 'utf8');
// let certificate = fs.readFileSync(props.sslCrt, 'utf8');
// let credentials = {key: privateKey, cert: certificate};

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
const forgClient = new forgapi.Client({
  url: String(props.auth.forgapi.url),
  agentOptions: props.auth.forgapi.agentOptions || {},
});

let cfAuthProvider: any;
// check whether we are testing and set the auth
if (props.test.testing === 'true') {
  debug('TEST mode is active!');
  cfAuthProvider = new cfauth.DevForgBasicProvider(forgClient, {});
} else {
  debug('Normal authentication mode is active!');
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

app.use(expressValidator({
  customValidators: {
    isOneOf: function(str: string , arr: any[]) {
      return (arr.indexOf(str) > -1);
    },
    isInEnum: function(str: string, e: any) {
      if (str in e) {
        return true;
      } else {
        return false;
      }
    },
    isArea: function(val: string, req: express.Request) {
      // Must be an array of strings
      let result: string[] = [];
      if (Array.isArray(val)) {
        debug('body is ' + cJSON.stringify(req.body, null, 2));
        debug('val is ' + cJSON.stringify(val, null, 2));
        val.forEach(function(element, idx, arr){
          let thisResult = validate.isString(element);
          // debug('validation for element: ' + thisResult);
          if (!thisResult) {
            // record all failed fields
            result.push(String(element) + ' must be a string');
          }
        });
        return true;
      } else {
        return false;
      }
    },
    isVvProcLoc: function(val: string, req: express.Request) {
      /* Case 1: The string is not a json array
       * Case 2: The Strins is an array, but the listed items are not valid urls.
       * Case 3: The string is an arra and all listed items are valif urls
       */
      let result: string[] = [];
      if (Array.isArray(val)) {
        debug('body is ' + cJSON.stringify(req.body, null, 2));
        val.forEach(function(element: string, idx: number, arr: any[]){
          debug('checking element ' + element);
          debug('checking element(by index) ' + req.body.vvProcLoc[idx]);
          let thisResult = validate.validate({website: element},
             {website: {url: true},
             });
          // debug('validation for element: ' + thisResult);
          if (thisResult) {
            // record all failed fields
            result.push(thisResult);
          }
        });
        debug('vals: ' + JSON.stringify(result, null, 2));
        // debug('#vals: ' + result.length);
        if (result.length !== 0) {
          return false; // Case 2
        } else {
          return true; // Case 3
        }
      } else {
        return false; // Case 1
      }
    },
    isVvResultsLoc: function(val: string, req: express.Request) {
      /* Case 1: The string is not a json array
       * Case 2: The Strins is an array, but the listed items are not valid urls.
       * Case 3: The string is an arra and all listed items are valif urls
       */
      let result: string[] = [];
      if (Array.isArray(val)) {
        debug('body is ' + cJSON.stringify(req.body, null, 2));
        val.forEach(function(element: string, idx: number, arr: any[]){
          debug('checking element ' + element);
          debug('checking element(by index) ' + req.body.vvResultsLoc[idx]);
          let thisResult = validate.validate({website: element},
             {website: {url: true},
             });
          // debug('validation for element: ' + thisResult);
          if (thisResult) {
            // record all failed fields
            result.push(thisResult);
          }
        });
        debug('vals: ' + JSON.stringify(result, null, 2));
        // debug('#vals: ' + result.length);
        if (result.length !== 0) {
          return false; // Case 2
        } else {
          return true; // Case 3
        }
      } else {
        return false; // Case 1
      }
    },
    isSlots: function(val: any[], req: express.Request) {
      // Must be an array of strings
      if (Array.isArray(val)) {
        val.forEach(function(element: any, idx: number, arr: any[]){
          req.checkBody('slots[' + idx + ']',
            'Slot ' + idx + ' must be a string')
            .optional().isAscii();
        });
        return true;
      } else {
        return false;
      }
    },
    isDRRs: function(val: any[], req: express.Request) {
      // Must be a string
      if (Array.isArray(val)) {
        val.forEach(function(element: any, idx: number , arr: any[]){
          req.checkBody('slots[' + idx + ']',
            'DRR ' + idx + ' must be a string')
            .optional().isAscii();
        });
        return true;
      } else {
        return false;
      }
    },
    isString: function(val: any) {
      if (typeof val === 'string') {
        return true;
      } else {
        return false;
      }
    },
  },
}));


// start the server
app.listen(props.webPort, function() {
  debug('listening on port ' + props.webPort);
});

// let httpsPort = Number(props.webPort);
// var httpsSrv = https.createServer(credentials, app).listen(httpsPort, function() {
//     console.log('Https listening on '+httpsPort);
// });

// auth middleware
// const auth = function(req: express.Request, res: express.Response, next: express.NextFunction) {
//   if (req.session && req.session.username === 'testuser' && req.session.admin) {
//     return next();
//   } else {
//     return res.status(401).send('Not authorized');
//   }
// };

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
  function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('PUT /api/v1/swdb/:id request');

  tools.SwdbLib.updateValidation(req);
  tools.SwdbLib.updateSanitization(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      be.updateDoc(auth.getUsername(req), req, res, next);
    }
  });
});


// handle incoming patch requests for update
app.patch('/api/v1/swdb/:id', auth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {
  debug('PATCH /api/v1/swdb/:id request');

  tools.SwdbLib.updateValidation(req);
  tools.SwdbLib.updateSanitization(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      be.updateDoc(auth.getUsername(req), req, res, next);
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

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      debug('POST /api/v1/inst calling create...');
      instBe.createDoc(auth.getUsername(req), req, res, next);
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

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      instBe.updateDoc(auth.getUsername(req), req, res, next);
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

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      instBe.updateDoc(auth.getUsername(req), req, res, next);
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
