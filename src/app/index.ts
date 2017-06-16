
import fs = require('fs');
import path = require('path');

import bodyparser = require('body-parser');
import express = require('express');
import favicon = require('serve-favicon');
import morgan = require('morgan');
import session = require('express-session');

import handlers = require('./shared/handlers');
import status = require('./shared/status');

// error interface
interface StatusError extends Error {
  status?: number;
}

// application configuration
interface AppCfg {
  port?: string;
  addr?: string;
  session_life?: number;
  session_secret?: string;
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

// read configuration file in JSON format
async function readConfigFile(name: string): Promise<object> {
  return new Promise(function (resolve, reject) {
    fs.readFile(path.resolve(path.resolve(__dirname, '../config', name)), 'utf8', function (err, data) {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  });
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
  let env = app.get('env');

  let appCfg: AppCfg = await readConfigFile('app.json');

  app.set('port', appCfg.port || '3000');
  app.set('addr', appCfg.addr || 'localhost');

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
    secret: appCfg.session_secret || 'secret',
    cookie: {
      maxAge: appCfg.session_life || 28800000,
    },
  }));

  app.use(express.static(path.resolve(__dirname, '../public')));
  app.use(express.static(path.resolve(__dirname, '../bower_components')));

  app.use('/status', status.router);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    let err: StatusError = new Error('Not Found');
    err.status = 404;
    next(err);
  });

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
