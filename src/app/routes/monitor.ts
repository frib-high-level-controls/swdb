
import process = require('process');
import util = require('util');

import express = require('express');

import monitor = require('../shared/monitor');

let routes = express.Router();

routes.get('/status', function (req: express.Request, res: express.Response) {
  res.status(200).render('status', {
    status: monitor.getStatus(),
  });
});

routes.get('/status/json', function (req: express.Request, res: express.Response) {
  res.status(200).json(monitor.getStatus());
});

export = routes;
