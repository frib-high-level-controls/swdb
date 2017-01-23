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
var util = require('util');
var mongoose = require('mongoose');
var be = require('./lib/db');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
var casAuth = require('./lib/auth');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
const swTable = JSON.parse(fs.readFileSync('./config/swData.json', 'utf8'));

// get the valid swNames from the db and populate the properties area
be.swNamesDoc.find({}, function(err, docs) {
  var swNames = [];
  if(!err){
    for (var i in docs)
    {
      swNames.push({id: i, "name": docs[i].swName});
      //console.log(swTable[i]["Name"]);
    }
  }
  props.swNames = swNames;
});

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
app.listen(props.webPort, function() {
  console.log('listening on port '+props.webPort);
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
app.get('/testlogin', function(req,res) {
  if (!req.query.username || !req.query.password ) {
    res.send('<p id="Test auth failed">Test auth failed</p>');
  } else if(req.query.username === 'testuser' &&
   req.query.password === 'testuserpasswd') {
     req.session.username = "testuser";
     req.session.admin = true;
     res.send('<p id="Test auth success">Test auth success</p>');
  }
});

app.get('/caslogin', casAuth.ensureAuthenticated, function(req,res) {
  //console.log("caslogin req: "+JSON.stringify(util.inspect(req.session)));
  if (req.session.username) {
    // cas has a username
    res.redirect(props.webUrl);

  } else {
    res.send('<p id="CAS auth failed">CAS auth failed</p>');
  }
});

// logoff
app.get('/logout', function(req,res) {
  req.session.destroy();
  delete req.query.ticket;
  res.clearCookie('connect.sid',{path: '/'});
  res.send('<p id="Logout complete">logout complete</p>');
});
// for get requests that are not specific return all
app.get('/swdbserv/v1/user', function(req, res, next) {
  res.send(JSON.stringify(req.session));
});

// for get requests that are not specific return all
app.get('/swdbserv/v1/config', function(req, res, next) {
  res.send(JSON.stringify(props));
});
// for get requests that are not specific return all
app.get('/swdbserv/v1*', function(req, res, next) {
  be.getDocs(req, res, next);
});

// handle incoming post requests
app.post('/swdbserv/v1', casAuth.ensureAuthenticated, function(req, res, next) {

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
app.put('/swdbserv/v1*', casAuth.ensureAuthenticated, function(req, res, next) {

  // Do validation for updates
  tools.updateValidation(req);
  tools.updateSanitization(req);

  var errors = req.validationErrors();

  if (errors) {
    //console.log("got errors:"+JSON.stringify(errors));
    //console.log("got PUTe: "+JSON.stringify(errors));
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    //console.log("got PUT: "+JSON.stringify(req.body));
    be.updateDoc(req, res, next);
  }

});

// handle incoming patch requests for update
app.patch('/swdbserv/v1*', casAuth.ensureAuthenticated, function(req,res,next) {

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
