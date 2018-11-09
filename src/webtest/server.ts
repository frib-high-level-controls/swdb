/**
 * This file is used only for running tests.
 *
 * When the routes have been seperated into there own modules,
 * this file should be removed and /src/app/test/app.ts used instead!
 */
import http = require('http');

import express = require('express');

import * as tasks from '../app/shared/tasks';

import app = require('../apptest/app');

// server singleton
let server: http.Server | null = null;

// server lifecycle
const task = new tasks.StandardTask<express.Application>(doStart, doStop);

export function start(): Promise<express.Application> {
  return task.start();
}

async function doStart(): Promise<express.Application> {
  const handler = await app.start();

  const port = handler.get('port') || '3000';
  await new Promise<void>((resolve, reject) => {
    server = http.createServer(handler);
    // Errors are NOT reported in the server.listen() callback!?
    // See bin/app for the original (more complete) implementation.
    server.on('listening', resolve);
    server.on('error', reject);
    server.listen(port);
  });
  app.info('HTTP Server listening on port: %s', port);

  return handler;
}


export function stop(): Promise<void> {
  return task.stop();
}

async function doStop(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (!server) {
      app.warn('HTTP Server not created');
      resolve();
      return;
    }
    server.close((err: any) => {
      if (err) {
        app.warn('HTTP Server close error: %s', err);
        resolve();
        return;
      }
      app.info('HTTP Server is closed');
      resolve();
      return;
    });
  });

  try {
    await app.stop();
  } catch (err) {
    app.warn('Application error while stopping: %s', err);
  }

  app.info('HTTP Server has stopped');
}
