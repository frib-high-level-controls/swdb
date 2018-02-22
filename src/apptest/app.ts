/**
 * Start and stop the test application.
 */
import * as path from 'path';

import * as bodyparser from 'body-parser';
import * as express from 'express';
import * as session from 'express-session';

import { State } from '../app';

import * as auth from '../app/shared/auth';
import * as forgauth from '../app/shared/forg-auth';
import * as handlers from '../app/shared/handlers';
import * as status from '../app/shared/status';
import * as tasks from '../app/shared/tasks';

import forgapi = require('./shared/mock-forgapi');

// application states
export type State = State;

// application singleton
let app: express.Application;

// application lifecycle
let task = new tasks.StandardTask<express.Application>(doStart, doStop);

// application logging
export let info = console.log;
export let warn = console.warn;
export let error = console.error;

export function getState(): State {
  return task.getState();
};

// start the test application
export function start(): Promise<express.Application> {
  return task.start();
}

async function doStart(): Promise<express.Application> {
  app = express();

  const forgClient = new forgapi.MockClient();

  const cfAuthProvider = new forgauth.DevForgBasicProvider(forgClient, {});

  auth.setProvider(cfAuthProvider);


  // status monitor start
  await status.monitor.start();

  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({
    extended: false,
  }));

  // session configuration
  app.use(session({
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: false,
    secret: 'test_secret',
    cookie: {
      maxAge: 28800000,
    },
  }));

  app.use(express.static(path.resolve(__dirname, '..', '..', 'public')));
  app.use(express.static(path.resolve(__dirname, '..', '..', 'bower_components')));

  app.use('/status', status.router);

  // no handler found for request
  app.use(handlers.notFoundHandler());

  // error handlers
  app.use(handlers.requestErrorHandler());

  return app;
}

// stop the test application
export function stop(): Promise<void> {
  return task.stop();
};

async function doStop(): Promise<void> {
  try {
    await status.monitor.stop();
  } catch (err) {
    warn('Status monitor stop failure: %s', err);
  }

  return;
};
