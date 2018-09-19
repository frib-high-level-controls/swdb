/**
 * Start and stop the test application.
 */
import * as path from 'path';

import * as bodyparser from 'body-parser';
import * as express from 'express';
import * as session from 'express-session';
import * as mongoose from 'mongoose';

import { State } from '../app';

import * as auth from '../app/shared/auth';
import * as forgauth from '../app/shared/forg-auth';
import * as handlers from '../app/shared/handlers';
import * as logging from '../app/shared/logging';
import * as status from '../app/shared/status';
import * as tasks from '../app/shared/tasks';

import * as forgapi from './shared/mock-forgapi';
import * as mongod from './shared/mongod';

import * as legacy from '../app/lib/legacy';

import * as dataproxy from '../app/routes/dataproxy';
import * as metadata from '../app/routes/metadata';
import * as softwares from '../app/routes/softwares';
import * as swinstalls from '../app/routes/swinstalls';

// application states
export type State = State;

// application singleton
let app: express.Application;

// application lifecycle
const task = new tasks.StandardTask<express.Application>(doStart, doStop);

// application logging
export let info = logging.log;
export let warn = logging.warn;
export let error = logging.error;

export function getState(): State {
  return task.getState();
}

// start the test application
export function start(): Promise<express.Application> {
  return task.start();
}

async function doStart(): Promise<express.Application> {
  app = express();

  if (app.get('env') === 'test') {
    // disable logging for testing
    logging.setInfo(null);
    logging.setWarn(null);
    logging.setError(null);
  }

  const forgClient = forgapi.MockClient.getInstance();

  const authProvider = new forgauth.DevForgBasicProvider(forgClient, {});

  auth.setProvider(authProvider);


  // status monitor start
  await status.monitor.start();

  // configure Mongoose (MongoDB)
  let mongoPort = 27017;
  if (process.env.WEBAPP_START_MONGOD === 'true') {
    mongoPort = await mongod.start();
  }

  const mongoUrl = `mongodb://localhost:${mongoPort}/webapp-test`;

  const mongoOptions: mongoose.ConnectionOptions = {
    useNewUrlParser: true,
  };

  await mongoose.connect(mongoUrl, mongoOptions);
  // Clear the DB on application startup?
  // await mongoose.connection.db.dropDatabase();

  // view engine configuration
  app.set('views', path.resolve(__dirname, '..', '..', 'views'));
  app.set('view engine', 'pug');
  app.set('view cache', true);

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

  app.use(authProvider.initialize());

  app.use(express.static(path.resolve(__dirname, '..', '..', 'public')));

  // set the response locals 'basePath'
  app.use(handlers.basePathHandler());

  // handle incoming get requests
  app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/login', authProvider.authenticate(), (req, res) => {
    if (req.query.bounce) {
      res.redirect(req.query.bounce);
      return;
    }
    res.redirect('/');
  });

  app.get('/logout', (req, res) => {
    authProvider.logout(req);
    res.redirect('/');
  });

  app.use('/status', status.router);

  app.use(metadata.getRouter());

  dataproxy.setForgClient(forgClient);
  app.use(dataproxy.getRouter());

  app.use(softwares.getRouter());
  app.use(swinstalls.getRouter());

  // no handler found for request
  app.use(handlers.notFoundHandler());

  // handle errors (temporary)
  app.use(legacy.requestErrorHandler);

  // error handlers
  app.use(handlers.requestErrorHandler());

  return app;
}

// stop the test application
export function stop(): Promise<void> {
  return task.stop();
}

async function doStop(): Promise<void> {

  // disconnect Mongoose (MongoDB)
  try {
    await mongoose.disconnect();
  } catch (err) {
    warn('Mongoose disconnect failure: %s', err);
  }

  if (process.env.WEBAPP_START_MONGOD === 'true') {
    try {
      await mongod.stop();
    } catch (err) {
      warn('MongoDB stop failure: %s', err);
    }
  }

  try {
    await status.monitor.stop();
  } catch (err) {
    warn('Status monitor stop failure: %s', err);
  }

  return;
}
