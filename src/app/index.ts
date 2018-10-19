/**
 * Start and configure the web application.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as util from 'util';

// Required syntax because the type declaration uses 'export = rc;'.
// (See: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/rc/index.d.ts)
import rc = require('rc');

import * as bodyparser from 'body-parser';
import * as express from 'express';
import * as session from 'express-session';
import * as morgan from 'morgan';
import * as favicon from 'serve-favicon';

import * as auth from './shared/auth';
import * as handlers from './shared/handlers';
import * as logging from './shared/logging';
import * as promises from './shared/promises';
import * as status from './shared/status';
import * as tasks from './shared/tasks';

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
}

// application states (same as tasks.State, but avoids the dependency)
export type State = 'STARTING' | 'STARTED' | 'STOPPING' | 'STOPPED';

// application singleton
let app: express.Application;

// application logging
export let info = logging.info;
export let warn = logging.warn;
export let error = logging.error;

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

  // view engine configuration
  app.set('views', path.resolve(__dirname, '..', 'views'));
  app.set('view engine', 'pug');
  app.set('view cache', (env === 'production') ? true : false);

  // Session configuration
  app.use(session({
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: false,
    secret: String(cfg.app.session_secret),
    cookie: {
      maxAge: Number(cfg.app.session_life),
    },
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

  // body-parser configuration
  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({
    extended: false,
  }));

  app.get('/login', auth.getProvider().authenticate({ rememberParams: [ 'bounce' ]}), (req, res) => {
    if (req.query.bounce) {
      res.redirect(req.query.bounce);
      return;
    }
    res.redirect(res.locals.basePath || '/');
  });

  app.get('/logout', (req, res) => {
    auth.getProvider().logout(req);
    res.redirect(res.locals.basePath || '/');
  });

  app.use('/status', status.router);

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

  try {
    await status.monitor.stop();
    info('Status monitor stopped');
  } catch (err) {
    warn('Status monitor stop failure: %s', err);
  }

  info('Application stopped');
}
