
import fs = require('fs');
import path = require('path');

import rc = require('rc');
import bodyparser = require('body-parser');
import express = require('express');
import favicon = require('serve-favicon');
import mongoose = require('mongoose');
import morgan = require('morgan');
import session = require('express-session');

import handlers = require('./shared/handlers');
import status = require('./shared/status');

// package metadata
interface Package {
  name?: {};
  version?: {};
};

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
    session_life: {};
    session_secret: {};
  };
  mongo: {
    port: {};
    addr: {};
    db: {};
    options: {};
  };
};

// application singleton
let app: express.Application;

// application logging
let log = console.log;
let warn = console.warn;
let error = console.error;

// application lifecycle
let state = 'stopped';

// application activity
let activeCount = 0;
let activeLimit = 100;
let activeStopped = Promise.resolve();

function updateActivityStatus(): void {
  if (activeCount <= activeLimit) {
    status.setComponentOk('Activity', activeCount + ' <= ' + activeLimit);
  } else {
    status.setComponentError('Activity', activeCount + ' > ' + activeLimit);
  }
};

// read the application name and version
async function readNameVersion(): Promise<[string | undefined, string | undefined]> {
  // first look for application name and version in the environment
  let name = process.env.NODE_APP_NAME;
  let version = process.env.NODE_APP_VERSION;
  // second look for application name and verison in packge.json
  if (!name || !version) {
    try {
      let pkg: Package = JSON.parse(await new Promise<string>((resolve, reject) => {
        fs.readFile(path.resolve(__dirname, '../package.json'), 'UTF-8', (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        });
      }));
      if (!name && pkg && pkg.name) {
        name = String(pkg.name);
      }
      if (!version && pkg && pkg.version) {
        version = String(pkg.version);
      }
    } catch (ierr) {
      // ignore //
    }
  }
  return [name, version];
};

// asynchronously start the application
async function start(): Promise<express.Application> {
  if (state !== 'stopped') {
    throw new Error('Application must be in "stopped" state');
  }

  let activeFinished: () => void;

  state = 'starting';
  log('Application starting');

  activeCount = 0;
  activeStopped = new Promise<void>(function (resolve) {
    activeFinished = resolve;
  });

  updateActivityStatus();

  app = express();

  let [name, version] = await readNameVersion();
  app.set('name', name);
  app.set('version', version);

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (state !== 'started') {
      res.status(503).end('application ' + state);
      return;
    }
    res.on('finish', () => {
      activeCount -= 1;
      updateActivityStatus();
      if (state === 'stopping' && activeCount <= 0) {
        activeFinished();
      }
    });
    activeCount += 1;
    updateActivityStatus();
    next();
  });

  try {
    await doStart();
  } catch (err) {
    try {
      await stop();
    } catch (ierr) {
      /* ignore */
    }
    throw err;
  }

  log('Application started');
  state = 'started';
  return app;
};


// asynchronously configure the application
async function doStart(): Promise<void> {
  let env: {} | undefined = app.get('env');
  let name: {} | undefined = app.get('name');

  let cfg: Config = {
    app: {
      port: '3000',
      addr: 'localhost',
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
      for (let file of cfg.configs) {
        log('Load configuration: %s', file);
      }
    }
  }

  app.set('port', String(cfg.app.port));
  app.set('addr', String(cfg.app.addr));

   // configure Mongoose (MongoDB)
  let mongoUrl = 'mongodb://' + cfg.mongo.addr + ':' + cfg.mongo.port + '/' + cfg.mongo.db;

  mongoose.Promise = global.Promise;

  mongoose.connection.on('connected', () => {
    status.setComponentOk('MongoDB', 'Connected');
    log('Mongoose default connection opened.');
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
  log('Mongoose default connection: %s', mongoUrl);
  mongoose.connect(mongoUrl, cfg.mongo.options);

  // view engine configuration
  app.set('views', path.resolve(__dirname, '../views'));
  app.set('view engine', 'pug');

  // favicon configuration
  app.use(favicon(path.resolve(__dirname, '../public', 'favicon.ico')));

  // morgan configuration
  morgan.token('remote-user', function (req) {
    if (req.session && req.session.userid) {
      return req.session.userid;
    } else {
      return 'unknown';
    }
  });

  if (env === 'production') {
    app.use(morgan('short'));
  } else {
    app.use(morgan('dev'));
  }

  // body-parser configuration
  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({
    extended: false,
  }));

  // session configuration
  app.use(session({
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: false,
    secret: String(cfg.app.session_secret),
    cookie: {
      maxAge: Number(cfg.app.session_life),
    },
  }));

  app.use(express.static(path.resolve(__dirname, '../public')));
  app.use(express.static(path.resolve(__dirname, '../bower_components')));

  app.use('/status', status.router);

  // no handler found for request (404)
  app.use(handlers.notFoundHandler);

  // error handlers
  app.use(handlers.requestErrorHandler);
};

// asynchronously stop the application
async function stop(): Promise<void> {
  if (state !== 'started') {
    throw new Error('Application must be in "started" state');
  }

  state = 'stopping';
  log('Application stopping');

  if (activeCount > 0) {
    log('Waiting for active requests to stop');
    await activeStopped;
  }

  try {
    await doStop();
  } finally {
    log('Application stopped');
    state = 'stopped';
  }
};

// asynchronously disconnect the application
async function doStop(): Promise<void> {
  return;
}

export { start, stop, log, warn, error };
