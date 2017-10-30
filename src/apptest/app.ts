/**
 * Start and stop the test application.
 */
import * as path from 'path';

// Unable to assign hrclient when imported using new ES6 syntax.
// See: https://github.com/Microsoft/TypeScript/issues/6751
import mongoose = require('mongoose');

import * as bodyparser from 'body-parser';
import * as express from 'express';
import * as session from 'express-session';

import { State } from '../app';

import * as handlers from '../app/shared/handlers';
import * as status from '../app/shared/status';
import * as tasks from '../app/shared/tasks';

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

  // status monitor start
  await status.monitor.start();

  // configure Mongoose (MongoDB)
  mongoose.Promise = global.Promise;

  const mongoUrl = 'mongodb://localhost:27017/webapp-test';

  const mongoOptions: mongoose.ConnectionOptions = {
    useMongoClient: true,
  };

  await mongoose.connect(mongoUrl, mongoOptions);
  // Clear the DB on application startup?
  // await mongoose.connection.db.dropDatabase();

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
  app.use(handlers.notFoundHandler);

  // error handlers
  app.use(handlers.requestErrorHandler);

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

  // disconnect Mongoose (MongoDB)
  try {
    await mongoose.disconnect();
  } catch (err) {
    warn('Mongoose disconnect failure: %s', err);
  }

  return;
};
