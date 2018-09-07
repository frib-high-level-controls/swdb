/**
 * Route handlers for data services (ie FORG or CCDB) proxy.
 */
import * as Debug from 'debug';
import * as express from 'express';

import * as forgapi from '../shared/forgapi';

import {
  catchAll,
} from '../shared/handlers';

const debug = Debug('swdb:routes:forgproxy');

let forgClient: forgapi.IClient;

export function getForgClient() {
  return forgClient;
}

export function setForgClient(client: forgapi.IClient) {
  forgClient = client;
}

const router = express.Router();

export function getRouter(opts?: {}): express.Router {
  return router;
}

// for get slot requests
// app.get('/api/v1/swdb/slot', (req: express.Request, res: express.Response, next: express.NextFunction) => {
//   debug('GET /api/v1/swdb/slot request');
//   instTools.InstLib.getSlot(req, res, next);
// });

// for get forg groups requests
router.get('/api/v1/swdb/forgGroups', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/forgGroups request');
  const groups = await forgClient.findGroups();
  res.json(groups);
}));

// for get forg areas requests
router.get('/api/v1/swdb/forgAreas', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/forgAreas request');
  const groups = await forgClient.findGroups();
  const areas: forgapi.Group[] = [];
  for (const group of groups) {
    if (group.type === 'AREA') {
      areas.push(group);
    }
  }
  res.json(areas);
}));

// for get forg users requests
router.get('/api/v1/swdb/forgUsers', catchAll(async (req, res) => {
  debug('GET /api/v1/swdb/forgUsers request');
  const users = await forgClient.findUsers();
  res.json(users);
}));
