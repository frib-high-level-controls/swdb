/**
 * Start and configure the web application.
 */
import crypto = require('crypto');
import fs = require('fs');
import net = require('net');
import path = require('path');
import util = require('util');

import bodyparser = require('body-parser');
import dbg = require('debug');
import express = require('express');
import session = require('express-session');
import mongoose = require('mongoose');
import morgan = require('morgan');
import rc = require('rc');
import favicon = require('serve-favicon');

import auth = require('./shared/auth');
import forgauth = require('./shared/forg-auth');
import forgapi = require('./shared/forgapi');
import handlers = require('./shared/handlers');
import logging = require('./shared/logging');
import promises = require('./shared/promises');
import status = require('./shared/status');
import tasks = require('./shared/tasks');

import * as legacy from './lib/legacy';

import * as dataproxy from './routes/dataproxy';
import * as metadata from './routes/metadata';
import * as softwares from './routes/softwares';
import * as swinstalls from './routes/swinstalls';

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
    host?: {};
    port: {};
    addr: {};
    db: {};
    options: {};
  };
  cas: {
    cas_url?: {};
    service_url?: {};
    service_base_url?: {};
    version?: {};
  };
  forgapi: {
    url?: {};
    agentOptions?: {};
  };
}

// application states (same as tasks.State, but avoids the dependency)
export type State = 'STARTING' | 'STARTED' | 'STOPPING' | 'STOPPED';

/////////////////////////////////////////////////
// Maintained for compatibility (non-template) //
//////////////////////////////////////////////////
const debug = dbg('swdb:index');
//////////////////////////////////////////////////

// application singleton
let app: express.Application;

// application logging
export let info = logging.info;
export let warn = logging.warn;
export let error = logging.error;

if (process.env.NODE_ENV === 'test') {
  logging.setInfo(null);
  logging.setWarn(null);
  // logging.setError(null);
}

// application lifecycle
const task = new tasks.StandardTask<express.Application>(doStart, doStop);

// application activity
const activeLimit = 100;
const activeResponses = new Set<express.Response>();
const activeSockets = new Set<net.Socket>();
let activeFinished = Promise.resolve();

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

  info('Application starting');

  app = express();

  const [name, version] = await readNameVersion();
  app.set('name', name);
  app.set('version', version);

  activeSockets.clear();
  activeResponses.clear();

  function updateActivityStatus(): void {
    if (activeResponses.size <= activeLimit) {
      status.setComponentOk('Activity', activeResponses.size + ' <= ' + activeLimit);
    } else {
      status.setComponentError('Activity', activeResponses.size + ' > ' + activeLimit);
    }
  }

  activeFinished = new Promise((resolve) => {
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (task.getState() !== 'STARTED') {
        res.status(503).end('Application ' + task.getState());
        return;
      }

      if (!activeResponses.has(res)) {
        activeResponses.add(res);
        updateActivityStatus();
        res.on('finish', () => {
          if (!activeResponses.delete(res)) {
            warn('Response is NOT active!');
          }
          updateActivityStatus();
          if (task.getState() === 'STOPPING' && activeResponses.size <= 0) {
            resolve();
          }
        });
      } else {
        warn('Response is ALREADY active!');
      }

      const socket = res.connection;
      if (!activeSockets.has(socket)) {
        activeSockets.add(socket);
        socket.on('close', () => {
          if (!activeSockets.delete(socket)) {
            warn('Socket is NOT active!');
          }
        });
      }

      next();
    });
  });

  const env: {} | undefined = app.get('env');
  info('Deployment environment: \'%s\'', env);

  const cfg: Config = {
    app: {
      port: '3000',
      addr: 'localhost',
      trust_proxy: false,
      session_life: 3600000,
      session_secret: crypto.randomBytes(50).toString('base64'),
    },
    mongo: {
      port: '27017',
      addr: 'localhost',
      db: 'webapp-dev',
      options: {
        // see http://mongoosejs.com/docs/connections.html
        useNewUrlParser: true,
      },
    },
    cas: {
      // no defaults
    },
    forgapi: {
      // no defaults
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
  if (!cfg.mongo.host) {
    cfg.mongo.host = `${cfg.mongo.addr}:${cfg.mongo.port}`;
  }
  mongoUrl +=  `${cfg.mongo.host}/${cfg.mongo.db}`;

  // Remove password from the MongoDB URL to avoid logging the password!
  info('Mongoose connection URL: %s', mongoUrl.replace(/\/\/(.*):(.*)@/, '//$1:<password>@'));

  if (mongoose.Promise !== global.Promise) {
    // Mongoose 5.x should use ES6 Promises by default!
    throw new Error('Mongoose is not using native ES6 Promises!');
  }

  status.setComponentError('MongoDB', 'Never Connected');
  info('Mongoose connection: Never Connected');

  // NOTE: Registering a listener for the 'error' event
  // suppresses error reporting from the connect() method.
  // Therefore call connect() BEFORE registering listeners!
  await mongoose.connect(mongoUrl, cfg.mongo.options);

  status.setComponentOk('MongoDB', 'Connected');
  info('Mongoose connection: Connected');

  mongoose.connection.on('connected', () => {
    status.setComponentOk('MongoDB', 'Connected');
    info('Mongoose connection: Connected');
  });

  mongoose.connection.on('disconnected', () => {
    status.setComponentError('MongoDB', 'Disconnected');
    warn('Mongoose connection: Disconnected');
  });

  mongoose.connection.on('timeout', () => {
    status.setComponentError('MongoDB', 'Timeout');
    info('Mongoose connection: Timeout');
  });

  mongoose.connection.on('reconnect', () => {
    status.setComponentError('MongoDB', 'Reconnected');
    info('Mongoose connection: Reconnected');
  });

  mongoose.connection.on('close', () => {
    status.setComponentError('MongoDB', 'Closed');
    warn('Mongoose connection: Closed');
  });

  mongoose.connection.on('reconnectFailed', () => {
    status.setComponentError('MongoDB', 'Reconnect Failed (Restart Required)');
    error('Mongoose connection: Reconnect Failed');
    // Mongoose has stopped attempting to reconnect,
    // so initiate appliction shutdown with the
    // expectation that systemd will auto restart.
    error('Sending Shutdown signal: SIGINT');
    process.kill(process.pid, 'SIGINT');
  });

  mongoose.connection.on('error', (err) => {
    status.setComponentError('MongoDB', '%s', err);
    error('Mongoose connection error: %s', err);
  });

  // view engine configuration
  app.set('views', path.resolve(__dirname, '..', 'views'));
  app.set('view engine', 'pug');
  app.set('view cache', (env === 'production') ? true : false);

  // Authentication configuration
  if (!cfg.forgapi.url) {
    throw new Error('FORG base URL not configured');
  }
  info('FORG API base URL: %s', cfg.forgapi.url);

  const forgClient = new forgapi.Client({
    url: String(cfg.forgapi.url),
    agentOptions: cfg.forgapi.agentOptions || {},
  });
  // Need the FORG base URL available to views
  app.locals.forgurl = String(cfg.forgapi.url);

  if (env === 'production' || process.env.WEBAPP_AUTHC_DISABLED !== 'true') {
    if (!cfg.cas.cas_url) {
      throw new Error('CAS base URL not configured');
    }
    info('CAS base URL: %s', cfg.cas.cas_url);

    if (!cfg.cas.service_base_url) {
       throw new Error('CAS service base URL not configured');
    }
    info('CAS service base URL: %s (service URL: %s)', cfg.cas.service_base_url, cfg.cas.service_url);

    auth.setProvider(new forgauth.ForgCasProvider(forgClient, {
      casUrl: String(cfg.cas.cas_url),
      casServiceUrl: String(cfg.cas.service_url),
      casServiceBaseUrl: String(cfg.cas.service_base_url),
      casVersion: cfg.cas.version ? String(cfg.cas.version) : undefined,
    }));
    info('CAS authentication provider enabled');
  } else {
    // Use this provider for local development that DISABLES authentication!
    auth.setProvider(new forgauth.DevForgBasicProvider(forgClient, {}));
    warn('Development authentication provider: Password verification DISABLED!');
  }

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
  } else {
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

  // handle incoming get requests
  app.get('/', (req, res) => {
    debug('GET / request');
    res.render('index');
  });

  app.get('/login', auth.getProvider().authenticate({ rememberParams: [ 'bounce' ]}), (req, res) => {
    debug('GET /login request');
    if (req.query.bounce) {
      res.redirect(req.query.bounce);
      return;
    }
    res.redirect(res.locals.basePath || '/');
  });

  // logoff
  app.get('/logout', (req, res) => {
    auth.getProvider().logout(req);
    const provider = auth.getProvider();
    if (provider instanceof forgauth.ForgCasProvider) {
      const redirectUrl = provider.getCasLogoutUrl(true);
      info('Redirect to CAS logout: %s', redirectUrl);
      res.redirect(redirectUrl);
      return;
    }
    res.redirect(res.locals.basePath || '/');
  });

  app.use('/status', status.router);

  app.use(metadata.getRouter());

  dataproxy.setForgClient(forgClient);
  app.use(dataproxy.getRouter());

  app.use(softwares.getRouter());
  app.use(swinstalls.getRouter());

  // no handler found for request (404)
  app.use(handlers.notFoundHandler());

  // legacy error handler (non-template)
  app.use(legacy.requestErrorHandler);

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

  if (activeResponses.size > 0) {
    info('Wait for %s active response(s)', activeResponses.size);
    try {
      await Promise.race([activeFinished, promises.rejectTimeout(15000)]);
    } catch (err) {
      warn('Timeout: End %s active response(s)', activeResponses.size);
      for (const res of activeResponses) {
        res.end();
      }
    }
  }

  if (activeSockets.size > 0) {
    warn('Destroy %s active socket(s)', activeSockets.size);
    for (const soc of activeSockets) {
      soc.destroy();
    }
  }

  // disconnect Mongoose (MongoDB)
  try {
    await mongoose.disconnect();
    info('Mongoose disconnected');
  } catch (err) {
    warn('Mongoose disconnect failure: %s', err);
  }

  try {
    await status.monitor.stop();
    info('Status monitor stopped');
  } catch (err) {
    warn('Status monitor stop failure: %s', err);
  }

  info('Application stopped');
}
