/**
 * Route handlers for meta data like user and interface configuration.
 */
import * as Debug from 'debug';
import * as express from 'express';

import * as auth from '../shared/auth';

import {
  ensureAccepts,
} from '../shared/handlers';

import * as software from '../models/software';
import * as swinstall from '../models/swinstall';

const debug = Debug('swdb:routes:metadata');

const router = express.Router();

export function getRouter(opts?: {}): express.Router {
  return router;
}

// Get the user profile including assigned roles
router.get('/api/v1/swdb/user', ensureAccepts('json'), (req, res) => {
  debug('GET /api/v1/swdb/user request');
  const data = { user: auth.getProvider().getUser(req) };
  debug('Sending user data: %s', JSON.stringify(data));
  res.json(data);
});

// Get the UI configuration
router.get('/api/v1/swdb/config', ensureAccepts('json'), (req, res) => {
  // update props and send config
  debug('GET /api/v1/swdb/config request');
  const config: any = {};  // TODO: use a type defined in webapi.d.ts

  config.LevelOfCareEnum = {};
  config.LevelOfCareEnum[software.CareLevel.LOW] = 'Low';
  config.LevelOfCareEnum[software.CareLevel.MEDIUM] = 'Medium';
  config.LevelOfCareEnum[software.CareLevel.HIGH] = 'High';

  config.StatusEnum = {};
  config.StatusEnum[software.Status.DEVEL] = 'Development';
  config.StatusEnum[software.Status.RDY_TEST] = 'Ready for test';
  config.StatusEnum[software.Status.RDY_INST] =  'Ready for install';
  config.StatusEnum[software.Status.DEP] = 'DEPRECATED';

  config.InstStatusEnum = {};
  config.InstStatusEnum[swinstall.Status.RDY_INST] = 'Ready for install';
  config.InstStatusEnum[swinstall.Status.RDY_VER] = 'Ready for verification';
  config.InstStatusEnum[swinstall.Status.RDY_BEAM] = 'Ready for beam';
  config.InstStatusEnum[swinstall.Status.RET] = 'Retired';

  config.RcsEnum = {};
  config.RcsEnum[software.VCS.GIT] = 'Git';
  config.RcsEnum[software.VCS.AC] = 'AssetCentre';
  config.RcsEnum[software.VCS.FS] =  'Filesystem';
  config.RcsEnum[software.VCS.DEB] =  'Debian';
  config.RcsEnum[software.VCS.OTHER] = 'Other';

  config.levelOfCareLabels = Object.keys(config.LevelOfCareEnum).map((k) => config.LevelOfCareEnum[k]);
  config.statusLabels = Object.keys(config.StatusEnum).map((k) => config.StatusEnum[k]);
  config.instStatusLabels = Object.keys(config.InstStatusEnum).map((k) => config.InstStatusEnum[k]);
  config.rcsLabels = Object.keys(config.RcsEnum).map((k) => config.RcsEnum[k]);

  res.json(config);
});
