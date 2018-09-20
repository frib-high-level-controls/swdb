/**
 * This file is used only for running tests.
 *
 * When the routes have been seperated into there own modules,
 * this file should be removed and /src/app/test/app.ts used instead!
 */
import http = require('http');

import express = require('express');

import app = require('../apptest/app');

let server: http.Server | undefined;

export function start(): Promise<express.Application> {
  return app.start().then((handler) => {
    return new Promise<express.Application>((resolve) => {
      const port = handler.get('port') || '3000';
      server = http.createServer(handler);
      server.listen(port, () => {
        app.info('HTTP Server listening on port: %s', port);
        resolve(handler);
      });
      // Note that errors are ignored, see /bin/app for a more complete implementation. //
    });
  });
}


export function stop(): Promise<void> {
  return app.stop().then(() => {
    return new Promise<void>((resolve) => {
      if (!server) {
        app.warn('HTTP Server is not listening');
        resolve();
        return;
      }
      server.close((err: string) => {
        if (err) {
            app.warn('HTTP Serve close error: %s', err);
            resolve();
            return;
        }
        app.info('HTTP Server is closed');
        resolve();
        return;
      });
    });
  });
}
