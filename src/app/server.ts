'use strict';
import bodyParser = require('body-parser');
// import circJSON = require('circular-json');
import cookieParser = require('cookie-parser');
import debug = require('debug');
import express = require('express');
import expressSession = require('express-session');
import expressValidator = require('express-validator');
import FileStreamRotator = require('file-stream-rotator');
import fs = require('fs');
import https = require('https');
import mongoose = require('mongoose');
import morgan = require('morgan');
import path = require('path');
import util = require('util');
import casAuth = require('./lib/auth');
import CommonTools = require('./lib/CommonTools');
import Be = require('./lib/Db');
import InstBe = require('./lib/instDb');
import instTools = require('./lib/instLib');
import tools = require('./lib/swdblib');
// import casAuth = require('/home/deployer/template-webapp/src/app/shared/auth');

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
app.use(express.static(__dirname + '/../../public'));
debug('using ' + __dirname + '/../../public');

// use JSON for data
app.use(bodyParser.json());

// Get the CORS params from rc and add to stack
app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.header('Access-Control-Allow-Origin', props.CORS.origin);
  res.header('Access-Control-Allow-Methods', props.CORS.methods);
  res.header('Access-Control-Allow-Headers', props.CORS.headers);
  next();
});

app.use(cookieParser());
app.use(expressSession({secret: '1234567890'}));
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
    isAreas: function(val: string, req: express.Request) {
      // Must be an array of strings
      if (Array.isArray(val)) {
        val.forEach(function(element, idx, arr){
          req.checkBody('area[' + idx + ']',
            'Area ' + idx + ' must be a string')
            .optional().isAscii();
        });
        return true;
      } else {
        return false;
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

// look for the logging directory, make it if necessary
// logging
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const writeLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDir, 'write_%DATE%.log'),
  frequency: 'daily',
  verbose: false,
});
// make a new token to expose the request body
morgan.token('reqBody', function getReqBody(req) {
  return JSON.stringify(req.body);
});
// insert the logging into the chain
// add a skip filter to ignore logging GETs
app.use(morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status ' +
  ':res[content-length] ":referrer" ":user-agent" :reqBody',
  { skip: function(req, res) {
    return req.method === 'GET';
  },
    stream: writeLogStream,
  },
));

// start the server
app.listen(props.webPort, function() {
  console.log('listening on port ' + props.webPort);
});

// let httpsPort = Number(props.webPort);
// var httpsSrv = https.createServer(credentials, app).listen(httpsPort, function() {
//     console.log('Https listening on '+httpsPort);
// });

// auth middleware
const auth = function(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session && req.session.username === 'testuser' && req.session.admin) {
    return next();
  } else {
    return res.status(401).send('Not authorized');
  }
};

// handle incoming get requests
app.get('/', function(req: express.Request, res: express.Response) {
  res.sendFile('index.html', {root: path.join(__dirname, '../../public/swdb-fe/')});
});

// login
app.get('/testlogin', function(req: express.Request, res: express.Response) {
  if (!req.query.username || !req.query.password ) {
    res.send('<p id="Test auth failed">Test auth failed</p>');
  } else if (req.query.username === 'testuser' &&
    req.query.password === 'testuserpasswd') {
    req.session.username = 'testuser';
    req.session.admin = true;
    res.send('<p id="Test auth success">Test auth success</p>');
  }
});

app.get('/caslogin', casAuth.ensureAuthenticated, function(req: express.Request, res: express.Response) {
  if (req.session.username) {
    // cas has a username
    res.redirect(props.webUrlProxy);

  } else {
    res.send('<p id="CAS auth failed">CAS auth failed</p>');
  }
});

// logoff
app.get('/logout', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  req.session.destroy((err: Error) => { next(err); });
  delete req.query.ticket;
  res.clearCookie('connect.sid', {path: '/'});
  res.send('<p id="Logout complete">logout complete</p>');
});

// for get requests that are not specific return all
app.get('/api/v1/swdb/user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.send(JSON.stringify(req.session));
});

// for get requests that are not specific return all
app.get('/api/v1/swdb/config', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  // update props and send config
  res.send(JSON.stringify(props));
});

// for get slot requests
app.get('/api/v1/swdb/slot', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  instTools.InstLib.getSlot(req, res, next);
});
// for get requests that are not specific return all
app.get('/api/v1/inst/*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  instBe.getDocs(req, res, next);
});
// for get requests that are not specific return all
app.get('/api/v1/swdb/*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  be.getDocs(req, res, next);
});

// handle incoming post requests
app.post('/api/v1/swdb', casAuth.ensureAuthenticated, function(req: express.Request, res: express.Response, next) {

  // Do validation for  new records

  tools.SwdbLib.newValidation(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      be.createDoc(req, res, next);
    }
  });
});

// handle incoming installation post requests
app.post('/api/v1/inst', function(req: express.Request, res: express.Response, next: express.NextFunction) {

  // Do validation for  new records
  instTools.InstLib.newValidation(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      instBe.createDoc(req, res, next);
    }
  });
});

// for get list of records requests
app.post('/api/v1/swdb/list', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  be.getList(req, res, next);
});

// handle incoming put requests for update
app.put('/api/v1/swdb*', casAuth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {

  tools.SwdbLib.updateValidation(req);
  tools.SwdbLib.updateSanitization(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      be.updateDoc(req, res, next);
    }
  });
});

// handle incoming put requests for installation update
app.put('/api/v1/inst*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Do validation for installation updates
  instTools.InstLib.updateValidation(req);
  instTools.InstLib.updateSanitization(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      instBe.updateDoc(req, res, next);
    }
  });
});

// handle incoming patch requests for update
app.patch('/api/v1/swdb*', casAuth.ensureAuthenticated,
  function(req: express.Request, res: express.Response, next: express.NextFunction) {

  tools.SwdbLib.updateValidation(req);
  tools.SwdbLib.updateSanitization(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      be.updateDoc(req, res, next);
    }
  });
});

// handle incoming put requests for installation update
app.patch('/api/v1/inst*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Do validation for installation updates
  instTools.InstLib.updateValidation(req);
  instTools.InstLib.updateSanitization(req);

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
      return;
    } else {
      instBe.updateDoc(req, res, next);
    }
  });
});

// handle incoming delete requests
// app.delete('/swdbserv/v1*', function(req, res, next) {
//   be.deleteDoc(req, res, next);
// });

// handle errors
app.use(function(err, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === 'ValidationError') {
    // catch mongo validation errors
    res.status(400);
    res.send(err);
  } else {
    res.status(err.status || 500);
    res.send(err.message || 'An error ocurred');
  }
});

module.exports = app;
