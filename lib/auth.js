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
  console.log('req.originalUrl: ' + req.originalUrl);
  var ticketUrl = url.parse(req.originalUrl, true);
  if (req.session && req.session.username) {
    console.log('req has a session: ' + req.session.username);
    // logged in already
    if (req.query.ticket) {
      // remove the ticket query param
      console.log('remove ticket ' + req.query.ticket);
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
    console.log('req has a ticket: ' + req.query.ticket);
    cas.validate(req.query.ticket, function (err, casresponse, result) {
      if (err) {
        log.error(err);
        return res.status(401).send(err.message);
      }
      if (result.validated) {
        console.log('ticket ' + req.query.ticket + ' validated');
        var username = result.username;
        // set userid in session
        req.session.username = username;
        return next();
 //       var searchFilter = ad.searchFilter.replace('_id', userid);
//        var opts = {
//          filter: searchFilter,
//          attributes: ad.memberAttributes,
//          scope: 'sub'
//        };
//
//        // query ad about other attribute
//        ldapClient.search(ad.searchBase, opts, false, function (err, result) {
//          if (err) {
//            log.error(err);
//            return res.status(500).send('something wrong with ad');
//          }
//          if (result.length === 0) {
//            log.warn('cannot find ' + userid);
//            return res.status(500).send(userid + ' is not found!');
//          }
//          if (result.length > 1) {
//            return res.status(500).send(userid + ' is not unique!');
//          }
//
//          // set username and memberof in session
//          req.session.username = result[0].displayName;
//          req.session.memberOf = filterGroup(result[0].memberOf);
//
//          debug('found ' + req.session.userid + ' from AD');
//          // load other info from db
//          User.findOne({
//            adid: userid
//          }).exec(function (err, user) {
//            if (err) {
//              log.error(err);
//            }
//            if (user) {
//              req.session.roles = user.roles;
//              // update user last visited on
//              User.findByIdAndUpdate(user._id, {
//                lastLoginOn: Date.now()
//              }, function (err) {
//                if (err) {
//                  log.error(err);
//                }
//                return redirect(req, res);
//              });
//            } else {
//              // create a new user
//              var first = new User({
//                adid: userid,
//                name: result[0].displayName,
//                email: result[0].mail,
//                office: result[0].physicalDeliveryOfficeName,
//                phone: result[0].telephoneNumber,
//                mobile: result[0].mobile,
//                lastLoginOn: Date.now()
//              });
//
//              first.save(function (err, newUser) {
//                if (err) {
//                  log.error(err);
//                  log.error(first.toJSON());
//                  return res.status(500).send('Cannot create user profile. Please contact admin.');
//                }
//                log.info('A new user created : ' + newUser);
//                req.session.roles = newUser.roles;
//                return redirect(req, res);
//              });
//            }
//          });
//        });
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
