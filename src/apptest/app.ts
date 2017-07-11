/**
 * Start and stop the test application.
 */
import * as path from 'path';

import * as bodyparser from 'body-parser';
import * as express from 'express';
import * as session from 'express-session';

import * as handlers from '../app/shared/handlers';
import * as status from '../app/shared/status';

// application singleton
let app: express.Application;

// application logging
export let log = console.log;
export let warn = console.warn;
export let error = console.error;

// start the test application
export async function start(): Promise<express.Application> {
  app = express();

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
