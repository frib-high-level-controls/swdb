"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var app = express();
var tools = require('./lib/swdblib.js');
var fs = require('fs');
var path = require('path');
var FileStreamRotator = require('file-stream-rotator');
var mongoose = require('mongoose');
var be = require('./lib/db');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
const props = JSON.parse(fs.readFileSync('./lib/properties.json', 'utf8'));

//allow access to staic files
app.use(express.static(__dirname + '/public'));

// use JSON for data
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({secret: '1234567890'}));
app.use(expressValidator({
  customValidators: {
    isOneOf: function(str,arr) {
      return (arr.indexOf(str) > -1);
    },
    isAuxSw: function(val,req) {
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("auxSw["+idx+"]",
          "Auxilliary SW field "+idx+" must be 4-30 characters")
          .optional().isAscii().isLength({min:4,max:30});
        });
        return true;
      } else {
        return false;
      }
    },
    isSwDescDoc: function(val,req) {
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("swDescDoc["+idx+"]",
          "SW description doc "+idx+" must be 4-30 characters")
          .optional().isAscii().isLength({min:4,max:30});
        });
        return true;
      } else {
        return false;
      }
    },
    isValidationDoc: function(val,req) {
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("validationDoc["+idx+"].doc",
          "Validation doc "+idx+" must be 4-30 characters")
          .optional().isAscii().isLength({min:4,max:30});
          req.checkBody("validationDoc["+idx+"].date",
          "Validation doc "+idx+" date must be a date")
          .optional().isDate();
        });
        return true;
      } else {
        return false;
      }
    },
    isVerificationDoc: function(val,req) {
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("verificationDoc["+idx+"].doc",
          "Verification doc "+idx+" must be 4-30 characters")
          .optional().isAscii().isLength({min:4,max:30});
          req.checkBody("verificationDoc["+idx+"].date",
          "Verification doc "+idx+" date must be a date")
          .optional().isDate();
        });
        return true;
      } else {
        return false;
      }
    },
    isComment: function(val,req) {
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("comment["+idx+"]",
          "Comment "+idx+" must be 4-30 characters")
          .optional().isAscii().isLength({min:4,max:30});
        });
        return true;
      } else {
        return false;
      }
    }
  }
}));

// look for the logging directory, make it if necessary
// logging
var logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
var writeLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDir, 'write_%DATE%.log'),
  frequency: 'daily',
  verbose: false
});
// make a new token to expose the request body
morgan.token('reqBody', function getReqBody (req) {
  return JSON.stringify(req.body);
});
// insert the logging into the chain
// add a skip filter to ignore logging GETs
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :reqBody',
{ skip: function (req, res) {
  return req.method == "GET";
},
stream: writeLogStream
}
));

// start the server
app.listen(3000, function() {
  console.log('listening on 3000');
});

// auth middleware
var auth = function(req, res, next) {
  if (req.session && req.session.username === "testuser" && req.session.admin){
    return next();
  } else {
    //console.log("session is :"+JSON.stringify(req.session));
    //console.log("cookies is :"+JSON.stringify(req.cookies));
    return res.status(401).send('Not authorized');
  }
};

// handle incoming get requests
app.get('/', function(req,res) {
  res.sendFile('index.html', {root: path.join(__dirname, '/public/swdb-fe/')});
});

// login
app.get('/login', function(req,res) {
  if (!req.query.username || !req.query.password ) {
    res.send('<p id="Test auth failed">Test auth failed</p>');
  } else if(req.query.username === 'testuser' &&
   req.query.password === 'testuserpasswd') {
     req.session.username = "testuser";
     req.session.admin = true;
     res.send('<p id="Test auth success">Test auth success</p>');
  }
});

// logoff
app.get('/logout', function(req,res) {
  req.session.destroy();
  res.send('<p id="Logout complete">logout complete</p>');
});

// for get requests that are not specific return all
app.get('/swdbserv/v1*', function(req, res, next) {
  be.getDocs(req, res, next);
});

// handle incoming post requests
app.post('/swdbserv/v1', auth, function(req, res, next) {

  // Do validation for  new records
  tools.newValidation(req);

  var errors = req.validationErrors();

  if (errors) {
    //console.log("got errors:"+JSON.stringify(errors));
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    be.createDoc(req, res, next);
  }
});

// handle incoming put requests for update
app.put('/swdbserv/v1*', auth, function(req, res, next) {

  // Do validation for updates
  tools.updateValidation(req);
  tools.updateSanitization(req);

  var errors = req.validationErrors();

  if (errors) {
    //console.log("got errors:"+JSON.stringify(errors));
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    be.updateDoc(req, res, next);
  }

});

// handle incoming patch requests for update
app.patch('/swdbserv/v1*', auth, function(req,res,next) {

  // Do validation for updates
  tools.updateValidation(req);
  var errors = req.validationErrors();

  if (errors) {
    //console.log("got errors:"+JSON.stringify(errors));
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    be.updateDoc(req, res, next);
  }

});

// handle incoming delete requests
// app.delete('/swdbserv/v1*', function(req, res, next) {
//   be.deleteDoc(req, res, next);
// });

// handle errors
app.use(function(err, req, res, next) {
  //console.error(err.stack);
  if (res.headerSent) {
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
