/**
 * Start and configure the web application.
 */
import bodyparser = require('body-parser');
import cookieParser = require('cookie-parser');
import dbg = require('debug');
import express = require('express');
import session = require('express-session');
import expressValidator = require('express-validator');
import fs = require('fs');
import mongoose = require('mongoose');
import morgan = require('morgan');
import path = require('path');
import util = require('util');

import rc = require('rc');
import favicon = require('serve-favicon');

import CommonTools = require('./lib/CommonTools');
import Be = require('./lib/Db');
import InstBe = require('./lib/instDb');
import instTools = require('./lib/instLib');
import tools = require('./lib/swdblib');
import customValidators = require('./lib/validators');

import auth = require('./shared/auth');
import forgauth = require('./shared/forg-auth');
import forgapi = require('./shared/forgapi');
import handlers = require('./shared/handlers');
import logging = require('./shared/logging');
import status = require('./shared/status');
import tasks = require('./shared/tasks');

import * as mockforgapi from './shared/mock-forgapi';

// package metadata
interface Package {
  name?: {};
  version?: {};
}

// application configuration
interface Config {
  // these properties are provided by the 'rc' library
  // and contain config file paths that have been read
  // (see https://www.npmjs.com/package/rc)
  config?: string;
  configs?: string[];
  app: {
    port: {};
    addr: {};
    trust_proxy: {};
    session_life: {};
    session_secret: {};
  };
  mongo: {
    user?: {};
    pass?: {};
    port: {};
    addr: {};
    db: {};
    options: {};
  };
}

// application states (same as tasks.State, but avoids the dependency)
export type State = 'STARTING' | 'STARTED' | 'STOPPING' | 'STOPPED';

/////////////////////////////////////////////////
// Maintained for compatibility (non-template) //
//////////////////////////////////////////////////
const debug = dbg('swdb:index');
const be = new Be.Db(true);
const instBe = new InstBe.InstDb(true);

const ctools = new CommonTools.CommonTools();
const props = ctools.getConfiguration();
debug('props at startup: ' + JSON.stringify(props, null, 2));
//////////////////////////////////////////////////

// application singleton
let app: express.Application;

// application logging
export let info = logging.info;
export let warn = logging.warn;
export let error = logging.error;

if (process.env.NODE_ENV === 'test') {
  info = () => { return; };
  warn = () => { return; };
  error = () => { return; };
}

// application lifecycle
const task = new tasks.StandardTask<express.Application>(doStart, doStop);

// application activity
let activeCount = 0;
const activeLimit = 100;
let activeStopped = Promise.resolve();

function updateActivityStatus(): void {
  if (activeCount <= activeLimit) {
    status.setComponentOk('Activity', activeCount + ' <= ' + activeLimit);
  } else {
    status.setComponentError('Activity', activeCount + ' > ' + activeLimit);
  }
}

const readFile = util.promisify(fs.readFile);

// read the application name and version
async function readNameVersion(): Promise<[string | undefined, string | undefined]> {
  // first look for application name and version in the environment
  let name = process.env.NODE_APP_NAME;
  let version = process.env.NODE_APP_VERSION;
  // second look for application name and verison in package.json
  if (!name || !version) {
    const pkgPath = path.resolve(__dirname, 'version.json');
    let pkg: Package | undefined;
    try {
      pkg = JSON.parse(await readFile(pkgPath, 'UTF-8'));
    } catch (err) {
      warn('Missing or invalid package metadata: %s: %s', pkgPath, err);
    }
    if (!name && pkg && pkg.name) {
      name = String(pkg.name);
    } else {
      name = String(name);
    }
    if (!version && pkg && pkg.version) {
      version = String(pkg.version);
    } else {
      version = String(version);
    }
  }
  return [name, version];
}

// get the application state
export function getState(): State {
  return task.getState();
}

// asynchronously start the application
export function start(): Promise<express.Application> {
  return task.start();
}

// asynchronously configure the application
async function doStart(): Promise<express.Application> {

  let activeFinished: () => void;

  info('Application starting');

  activeCount = 0;
  activeStopped = new Promise<void>((resolve) => {
    activeFinished = resolve;
  });

  updateActivityStatus();

  app = express();

  const [name, version] = await readNameVersion();
  app.set('name', name);
  app.set('version', version);

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (task.getState() !== 'STARTED') {
      res.status(503).end('Application ' + task.getState());
      return;
    }
    res.on('finish', () => {
      activeCount -= 1;
      updateActivityStatus();
      if (task.getState() === 'STOPPING' && activeCount <= 0) {
        activeFinished();
      }
    });
    activeCount += 1;
    updateActivityStatus();
    next();
  });

  const env: {} | undefined = app.get('env');

  const cfg: Config = {
    app: {
      port: '3000',
      addr: 'localhost',
      trust_proxy: false,
      session_life: 28800000,
      session_secret: 'secret',
    },
    mongo: {
      port: '27017',
      addr: 'localhost',
      db: 'webapp-dev',
      options: {
        // see http://mongoosejs.com/docs/connections.html
        useMongoClient: true,
      },
    },
  };

  if (name && (typeof name === 'string')) {
    rc(name, cfg);
    if (cfg.configs) {
      for (const file of cfg.configs) {
        info('Load configuration: %s', file);
      }
    }
  }

  app.set('port', String(cfg.app.port));
  app.set('addr', String(cfg.app.addr));

  // Proxy configuration (https://expressjs.com/en/guide/behind-proxies.html)
  app.set('trust proxy', cfg.app.trust_proxy || false);

  // Status monitor start
  await status.monitor.start();
  info('Status monitor started');

  // configure Mongoose (MongoDB)
  let mongoUrl = 'mongodb://';
  if (cfg.mongo.user) {
    mongoUrl += encodeURIComponent(String(cfg.mongo.user));
    if (cfg.mongo.pass) {
      mongoUrl += ':' + encodeURIComponent(String(cfg.mongo.pass));
    }
    mongoUrl += '@';
  }
  mongoUrl += cfg.mongo.addr + ':' + cfg.mongo.port + '/' + cfg.mongo.db;

  mongoose.Promise = global.Promise;

  mongoose.connection.on('connected', () => {
    status.setComponentOk('MongoDB', 'Connected');
    info('Mongoose default connection opened.');
  });

  mongoose.connection.on('disconnected', () => {
    status.setComponentError('MongoDB', 'Disconnected');
    warn('Mongoose default connection closed');
  });

  mongoose.connection.on('error', (err) => {
    status.setComponentError('MongoDB', err.message || 'Unknown Error');
    error('Mongoose default connection error: %s', err);
  });

  status.setComponentError('MongoDB', 'Never Connected');
  // Remove password from the mongoUrl to avoid logging the password!
  const safeMongoUrl = mongoUrl.replace(/\/\/(.*):(.*)@/, '//$1:******@');
  info('Mongoose default connection: %s', safeMongoUrl);
  await mongoose.connect(mongoUrl, cfg.mongo.options);

  // view engine configuration
  app.set('views', path.resolve(__dirname, '..', 'views'));
  app.set('view engine', 'pug');
  app.set('view cache', (env === 'production') ? true : false);

  // Get the CORS params from rc and add to stack
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Access-Control-Allow-Origin', props.CORS.origin);
    res.header('Access-Control-Allow-Methods', props.CORS.methods);
    res.header('Access-Control-Allow-Headers', props.CORS.headers);
    next();
  });

  // Authentication configuration
  let forgClient: forgapi.IClient;
  if (env === 'production' || process.env.WEBAPP_AUTHC_DISABLED !== 'mock') {
    // if (!cfg.forgapi.url) {
    //   throw new Error('FORG base URL not configured');
    // }
    // info('FORG API base URL: %s', cfg.forgapi.url);

    forgClient = new forgapi.Client({
      url: String(props.auth.forgapi.url),
      agentOptions: props.auth.forgapi.agentOptions || {},
      // url: String(cfg.forgapi.url),
      // agentOptions: cfg.forgapi.agentOptions || {},
    });
    // Need the FORG base URL available to views
    // app.locals.forgurl = String(cfg.forgapi.url);
  } else {
    warn('FORG API mock client initialized');
    forgClient = mockforgapi.MockClient.getInstance();
  }

  if (env === 'production'
      || (process.env.WEBAPP_AUTHC_DISABLED !== 'true'
          && process.env.WEBAPP_AUTHC_DISABLED !== 'mock')) {
    // if (!cfg.cas.cas_url) {
    //   throw new Error('CAS base URL not configured');
    // }
    // info('CAS base URL: %s', cfg.cas.cas_url);

    // if (!cfg.cas.service_base_url) {
    //   throw new Error('CAS service base URL not configured');
    // }
    // info('CAS service base URL: %s (service URL: %s)', cfg.cas.service_base_url, cfg.cas.service_url);

    auth.setProvider(new forgauth.ForgCasProvider(forgClient, {
      casUrl: String(props.auth.cas.cas_url),
      casServiceUrl: String(props.auth.cas.service_url),
      casAppendPath: props.auth.cas.append_path === true ? true : false,
      casVersion: props.auth.cas.version ? String(props.auth.cas.version) : undefined,
      // casUrl: String(cfg.cas.cas_url),
      // casServiceUrl: String(cfg.cas.service_url),
      // casServiceBaseUrl: String(cfg.cas.service_base_url),
      // casVersion: cfg.cas.version ? String(cfg.cas.version) : undefined,
    }));
    info('CAS authentication provider enabled');
  } else {
    // Use this provider for local development that DISABLES authentication!
    auth.setProvider(new forgauth.DevForgBasicProvider(forgClient, {}));
    warn('Development authentication provider: Password verification DISABLED!');
  }

  // Set custom validators in expressValidator
  app.use(expressValidator(customValidators.CustomValidators.vals));

  // Session configuration
  app.use(session({
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: false,
    secret: String(cfg.app.session_secret),
    cookie: {
      maxAge: Number(cfg.app.session_life),
    },
    // Calls req.session.destroy() if user has logged out
    // (see: https://github.com/jaredhanson/passport/issues/216)
    unset: 'destroy',
  }));

  // Authentication handlers (must follow session middleware)
  app.use(auth.getProvider().initialize());

  // Request logging configuration (must follow authc middleware)
  morgan.token('remote-user', (req) => {
    const username = auth.getUsername(req);
    return username || 'anonymous';
  });

  if (env === 'production') {
    app.use(morgan('short'));
  } else if (props.test.testing !== 'true') {
    app.use(morgan('dev'));
  }

  // favicon configuration
  app.use(favicon(path.resolve(__dirname, '..', 'public', 'favicon.ico')));

  // static file configuration
  app.use(express.static(path.resolve(__dirname, '..', 'public')));

  // Redirect requests ending in '/' and set response locals 'basePath'
  app.use(handlers.basePathHandler());

  // body-parser configuration
  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({
    extended: false,
  }));

  app.use(cookieParser());

  // handle incoming get requests
  app.get('/', (req: express.Request, res: express.Response) => {
    debug('GET / request');
    res.render('index');
  });

  app.get('/login', auth.getProvider().authenticate(), (req: express.Request, res: express.Response) => {
    debug('GET /login request');
    if (req.query.bounce) {
      res.redirect(req.query.bounce);
      return;
    }
    res.redirect(res.locals.basePath || '/');
  });

  // logoff
  app.get('/logout', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /logout request');
    delete req.query.ticket;
    auth.getProvider().logout(req);
    res.redirect(props.auth.cas.cas_url + '/logout');
  });

  app.use('/status', status.router);

  // for get requests that are not specific return all
  app.get('/api/v1/swdb/user', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/user request');
    res.json({ user: auth.getProvider().getUser(req) });
    debug('sending user data ' + JSON.stringify({ user: auth.getProvider().getUser(req) }, null, 2));
  });

  // for get requests that are not specific return all
  app.get('/api/v1/swdb/config', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // update props and send config
    debug('GET /api/v1/swdb/config request');
    res.send(JSON.stringify(props));
  });

  // for get slot requests
  app.get('/api/v1/swdb/slot', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/slot request');
    instTools.InstLib.getSlot(req, res, next);
  });

  // for get forg groups requests
  app.get('/api/v1/swdb/forgGroups', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/forgGroups request');
    tools.SwdbLib.getForgGroups(req, res, next);
  });

  // for get forg areas requests
  app.get('/api/v1/swdb/forgAreas', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/forgAreas request');
    tools.SwdbLib.getForgAreas(req, res, next);
  });

  // for get forg users requests
  app.get('/api/v1/swdb/forgUsers', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/forgUsers request');
    tools.SwdbLib.getForgUsers(req, res, next);
  });

  // for get history requests
  app.get('/api/v1/swdb/hist/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/hist/* request');
    be.getHist(req, res, next);
  });
  // for get requests that are specific
  app.get('/api/v1/swdb/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/* request');
    be.getDocs(req, res, next);
  });
  // for get requests that are not specific return all
  app.get('/api/v1/swdb', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/swdb/* request');
    be.getDocs(req, res, next);
  });

  // handle incoming post requests
  app.post('/api/v1/swdb', auth.ensureAuthenticated,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('POST /api/v1/swdb request');
    // Do validation for  new records

    tools.SwdbLib.newValidation(req);

    req.getValidationResult().then((result) => {
      if (!result.isEmpty()) {
        debug('validation result: ' + JSON.stringify(result.array()));
        res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
        return;
      } else {
        const username = auth.getUsername(req);
        if (!username) {
          res.status(500).send('Ensure authenticated failed');
          return;
        }
        const dateObj = new Date(req.body.statusDate);
        req.body.statusDate = dateObj;
        be.createDoc(username, req, res, next);
      }
    });
  });

  // for get list of records requests
  app.post('/api/v1/swdb/list', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('POST /api/v1/swdb/list request');
    be.getList(req, res, next);
  });

  // handle incoming put requests for update
  app.put('/api/v1/swdb/:id', auth.ensureAuthenticated,
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('PUT /api/v1/swdb/:id request');

    tools.SwdbLib.updateValidation(req);
    tools.SwdbLib.updateSanitization(req);
    req.getValidationResult().then(async (result) => {
      if (!result.isEmpty()) {
        res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
        return;
      } else {
        // setup an array of validations to perfrom
        // save the results in wfResultsArr, and errors in errors.
        const wfValArr = [
          customValidators.CustomValidators.swNoVerBranchChgIfStatusRdyInstall,
          customValidators.CustomValidators.noSwStateChgIfReferringInst,
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
          be.updateDoc(username, req, res, next);
        }
      }
    });
  });


  // handle incoming patch requests for update
  app.patch('/api/v1/swdb/:id', auth.ensureAuthenticated,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('PATCH /api/v1/swdb/:id request');

    tools.SwdbLib.updateValidation(req);
    tools.SwdbLib.updateSanitization(req);
    req.getValidationResult().then(async (result) => {
      if (!result.isEmpty()) {
        res.status(400).send('Validation errors: ' + JSON.stringify(result.array()));
        return;
      } else {
        // setup an array of validations to perfrom
        // save the results in wfResultsArr, and errors in errors.
        const wfValArr = [
          customValidators.CustomValidators.swNoVerBranchChgIfStatusRdyInstall,
          customValidators.CustomValidators.noSwStateChgIfReferringInst,
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
          be.updateDoc(username, req, res, next);
        }
      }
    });

  });


  // Handle installation requests
  // for get requests that are not specific return all
  app.get('/api/v1/inst/hist/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/inst/hist/:id request');
    instBe.getHist(req, res, next);
  });
  // for get requests that are specific
  app.get('/api/v1/inst/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/inst/:id request');
    instBe.getDocs(req, res, next);
  });
  // for get requests that are not specific return all
  app.get('/api/v1/inst', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('GET /api/v1/inst/:id request');
    instBe.getDocs(req, res, next);
  });

  // handle incoming installation post requests
  app.post('/api/v1/inst', auth.ensureAuthenticated,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {

    debug('POST /api/v1/inst request');
    // Do validation for  new records
    instTools.InstLib.newValidation(req);

    req.getValidationResult().then(async (result) => {
      if (!result.isEmpty()) {
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
          instBe.createDoc(username, req, res, next);
        }
      }
    });
  });

  // handle incoming put requests for installation update
  app.put('/api/v1/inst/:id', auth.ensureAuthenticated,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('PUT /api/v1/inst/:id request');
    // Do validation for installation updates
    instTools.InstLib.updateValidation(req);
    instTools.InstLib.updateSanitization(req);
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
          instBe.updateDoc(username, req, res, next);
        }
      }
    });
  });

  // handle incoming put requests for installation update
  app.patch('/api/v1/inst/:id', auth.ensureAuthenticated,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
    debug('PATCH /api/v1/inst/:id request');
    // Do validation for installation updates
    instTools.InstLib.updateValidation(req);
    instTools.InstLib.updateSanitization(req);
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
          instBe.updateDoc(username, req, res, next);
        }
      }
    });
  });

  // handle incoming delete requests
  // app.delete('/swdbserv/v1*', function(req, res, next) {
  //   be.deleteDoc(req, res, next);
  // });

  // handle errors
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

  // no handler found for request (404)
  app.use(handlers.notFoundHandler());

  // error handlers
  app.use(handlers.requestErrorHandler());

  info('Application started');
  return app;
}

// asynchronously stop the application
export function stop(): Promise<void> {
  return task.stop();
}

// asynchronously disconnect the application
async function doStop(): Promise<void> {
  info('Application stopping');

  if (activeCount > 0) {
    info('Waiting for active requests to stop');
    await activeStopped;
  }

  try {
    await status.monitor.stop();
    info('Status monitor stopped');
  } catch (err) {
    warn('Status monitor stop failure: %s', err);
  }

  // disconnect Mongoose (MongoDB)
  try {
    await mongoose.disconnect();
    info('Mongoose disconnected');
  } catch (err) {
    warn('Mongoose disconnect failure: %s', err);
  }

  info('Application stopped');
}
