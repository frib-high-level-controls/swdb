// authentication and authorization functions
var Client = require('cas.js');
var url = require('url');
//var config = require('../config/config.js');
//var ad = config.ad;
//var auth = config.auth;
//var log = require('./log');
//var debug = require('debug')('runcheck:auth');

//var ldapClient = require('../lib/ldap-client');

//var mongoose = require('mongoose');
//var User = mongoose.model('User');
var fs = require('fs');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));

var cas = new Client({
  base_url: props.auth.cas,
  service: props.auth.login_service,
  version: 1.0
});

//function cn(s) {
//  var first = s.split(',', 1)[0];
//  return first.substr(3).toLowerCase();
//}

//function filterGroup(a) {
//  var output = [];
//  var i;
//  var group;
//  for (i = 0; i < a.length; i += 1) {
//    group = cn(a[i]);
//    if (group.indexOf('lab.frib') === 0) {
//      output.push(group);
//    }
//  }
//  return output;
//}

//function redirect(req, res) {
//  if (req.session.landing && req.session.landing !== '/login') {
//    return res.redirect(req.session.landing);
//  } else {
//    // has a ticket but not landed before
//    return res.redirect('/');
//  }
//}

function ensureAuthenticated(req, res, next) {
  var ticketUrl = url.parse(req.originalUrl, true);
  if (req.session && req.session.username) {
    //console.log('req has a session: ' + req.session.username);
    // logged in already
    if (req.query.ticket) {
      // remove the ticket query param
      //console.log('remove ticket ' + req.query.ticket);
      delete ticketUrl.query.ticket;
      return res.redirect(301, url.format({
        pathname: ticketUrl.pathname,
        query: ticketUrl.query
      }));
    }
    next();
  } else if (req.query.ticket) {
    // just kicked back by CAS
    // validate the ticket
    //console.log('req has a ticket: ' + req.query.ticket);
    cas.validate(req.query.ticket, function (err, casresponse, result) {
      if (err) {
        log.error(err);
        return res.status(401).send(err.message);
      }
      if (result.validated) {
        //console.log('ticket ' + req.query.ticket + ' validated');
        var username = result.username;
        // set userid in session
        req.session.username = username;
        return next();
      } else {
        log.error('CAS reject this ticket');
        //return res.redirect(req.proxied ? auth.login_proxied_service : auth.login_service);
        return res.status(401).send('Authentication failed');
      }
    });
  } else {
    // if this is ajax call, then send 401 without redirect
    if (req.xhr) {
      // TODO: might need to properly set the WWW-Authenticate header
      //res.set('WWW-Authenticate', 'CAS realm="' + auth.service + '"');
      return res.status(401).send('xhr cannot be authenticated');
    } else {
      // set the landing, the first unauthenticated url
      req.session.landing = req.originalUrl;
      //return res.redirect(auth.cas + '/login?service=' + encodeURIComponent(auth.login_service));
      return res.status(401).send('Not authenticated');
    }
  }
}


//function sessionLocals(req, res, next) {
//  res.locals.session = req.session;
//  next();
//}


//function verifyRole(role) {
//  return function (req, res, next) {
//    if (req.session.roles) {
//      if (req.session.roles[role]) {
//        return next();
//      } else {
//        return res.status(403).send('You are not authorized to access this resource. ');
//      }
//    } else {
//      log.warn('Cannot find the user\'s role.');
//      return res.status(500).send('something wrong for the user\'s session');
//    }
//  };
//}

module.exports = {
  ensureAuthenticated: ensureAuthenticated,
//  verifyRole: verifyRole,
//  sessionLocals: sessionLocals
};
