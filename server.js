"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var app = express();
var tools = require('./lib/swdblib.js');
var instTools = require('./lib/instLib.js');
var fs = require('fs');
var path = require('path');
var FileStreamRotator = require('file-stream-rotator');
var util = require('util');
var mongoose = require('mongoose');
var be = require('./lib/db');
var instBe = require('./lib/instDb');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
var casAuth = require('./lib/auth');
const circJSON = require('circular-json');
var props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));

// get the valid swNames from the db and populate the properties area
be.swNamesDoc.find({}, function(err, docs) {
  var swNames = [];
  var validSwNames = [];
  if(!err){
    for (var i in docs) {
      swNames.push({id: i, "name": docs[i].swName});
      validSwNames.push(docs[i].swName);
    }
  }
  props.swNames = swNames;
  props.validSwNames = validSwNames;
});

//allow access to static files
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
    isComment: function(val,req) {
      if (Array.isArray(val)){
        return true;
      } else {
        return false;
      }
    },
    isAreas: function(val,req) {
      // Must be an array of strings
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("area["+idx+"]",
            "Area "+idx+" must be a string")
            .optional().isAscii();
        });
        return true;
      } else {
        return false;
      }
    },
    isSlots: function(val,req) {
      // Must be an array of strings
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("slots["+idx+"]",
            "Slot "+idx+" must be a string")
            .optional().isAscii();
        });
        return true;
      } else {
        return false;
      }
    },
    isDRRs: function(val,req) {
      // Must be a string
      if (Array.isArray(val)){
        val.forEach(function(element, idx, arr){
          req.checkBody("slots["+idx+"]",
            "DRR "+idx+" must be a string")
            .optional().isAscii();
        });
        return true;
      } else {
        return false;
      }
    },
    isDesc: function(val,req) {
      if (Array.isArray(val)){
        //val.forEach(function(element, idx, arr){
          //req.checkBody("desc["+idx+"]",
            //"Description "+idx+" must be 4-30 characters")
            //.optional().isAscii();
        //});
        return true;
      } else {
        return false;
      }
    },
    isString: function(val) {
      if (typeof val === 'string'){
        console.log("true val is: "+JSON.stringify(val));
        return true;
      } else {
        console.log("false val is: "+JSON.stringify(val));
        return ;
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
app.get('/api/v1/swdb/user', function(req, res, next) {
  res.send(JSON.stringify(req.session));
});

// for get requests that are not specific return all
app.get('/api/v1/swdb/config', function(req, res, next) {
  // update props and send config
  be.swNamesDoc.find(function(err,docs){
    if (!err) {
      var validSwNames=[];
      var validSwNamesGUIList=[];
      for (var i in docs)
      {
        validSwNames.push(docs[i].swName);
        validSwNamesGUIList.push({"id":i,"name":docs[i].swName});
      }
      props.validSwNames = validSwNames;
      props.validSwNamesGUIList = validSwNamesGUIList;
      res.send(JSON.stringify(props));
    } else {
    }
  });
});

// for get slot requests
app.get('/api/v1/swdb/slot', function(req, res, next) {
  instTools.getSlot(req, res, next);
});
// for get requests that are not specific return all
app.get('/api/v1/inst/*', function(req, res, next) {
  instBe.getDocs(req, res, next);
});
// for get requests that are not specific return all
app.get('/api/v1/swdb/*', function(req, res, next) {
  be.getDocs(req, res, next);
});

// handle incoming post requests
app.post('/api/v1/swdb', casAuth.ensureAuthenticated, function(req, res, next) {

  // Do validation for  new records
  be.swNamesDoc.find(function(err,docs){
    if (!err) {
      var validSwNames=[];
      for (var i in docs)
      {
        validSwNames.push(docs[i].swName);
      }
      props.validSwNames = validSwNames;
    } else {
    }

    tools.newValidation(props.validSwNames,req);

    var errors = req.validationErrors();
    if (errors) {
      res.status(400).send('Validation errors: ' + JSON.stringify(errors));
      return;
    } else {
      be.createDoc(req, res, next);
    }
  });
});
// handle incoming installation post requests
app.post('/api/v1/inst', function(req, res, next) {

  // Do validation for  new records

  instTools.newValidation(req);

  var errors = req.validationErrors();
  if (errors) {
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    instBe.createDoc(req, res, next);
  }
});
// for get list of records requests
app.post('/api/v1/swdb/list', function(req, res, next) {
  be.getList(req, res, next);
});

// handle incoming put requests for update
app.put('/api/v1/swdb*', casAuth.ensureAuthenticated, function(req, res, next) {

  // Do validation for updates
  be.swNamesDoc.find(function(err,docs){
    if (!err) {
      var validSwNames=[];
      for (var i in docs)
      {
        validSwNames.push(docs[i].swName);
      }
      props.validSwNames = validSwNames;
    } else {
    }

    tools.updateValidation(props.validSwNames,req);
    tools.updateSanitization(req);

    var errors = req.validationErrors();

    if (errors) {
      res.status(400).send('Validation errors: ' + JSON.stringify(errors));
      return;
    } else {
      be.updateDoc(req, res, next);
    }

  });
});
// handle incoming put requests for installation update
app.put('/api/v1/inst*', function(req, res, next) {
  // Do validation for installation updates
  instTools.updateValidation(req);
  instTools.updateSanitization(req);

  var errors = req.validationErrors();

  if (errors) {
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    instBe.updateDoc(req, res, next);
  }
});

// handle incoming patch requests for update
app.patch('/api/v1/swdb*', casAuth.ensureAuthenticated, function(req,res,next) {

  // Do validation for updates
  be.swNamesDoc.find(function(err,docs){
    if (!err) {
      var validSwNames=[];
      for (var i in docs)
      {
        validSwNames.push(docs[i].swName);
      }
      props.validSwNames = validSwNames;
    } else {
    }

    tools.updateValidation(props.validSwNames,req);
    tools.updateSanitization(req);

    var errors = req.validationErrors();

    if (errors) {
      res.status(400).send('Validation errors: ' + JSON.stringify(errors));
      return;
    } else {
      be.updateDoc(req, res, next);
    }

  });
});
// handle incoming put requests for installation update
app.patch('/api/v1/inst*', function(req, res, next) {
  // Do validation for installation updates
  instTools.updateValidation(req);
  instTools.updateSanitization(req);

  var errors = req.validationErrors();

  if (errors) {
    res.status(400).send('Validation errors: ' + JSON.stringify(errors));
    return;
  } else {
    instBe.updateDoc(req, res, next);
  }
});

// handle incoming delete requests
// app.delete('/swdbserv/v1*', function(req, res, next) {
//   be.deleteDoc(req, res, next);
// });

// handle errors
app.use(function(err, req, res, next) {
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
