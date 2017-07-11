/**
 * Test the application status REST API
 */
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { assert } from 'chai';
import * as express from 'express';
import * as request from 'supertest';

import * as app from './app';
import * as jsonschema from './jsonschema';

import * as status from '../app/shared/status';

let handler: express.Application;

before(async function() {
  handler = await app.start();
});

describe('Application status API', function() {

  it('Get application status', function() {
    return request(handler)
      .get('/status/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(jsonschema.checkValid('status'))
      .expect((res: request.Response) => {
        let status = <status.ApplicationStatus> res.body;
        assert.equal(res.body.status, 'OK', 'Expected application status is "OK"');
      });
  });

  it('Set component status "OK"', function() {
    const COMP_NAME = 'Test Comp';
    const COMP_MFORMAT = 'Test Message: %s';
    const COMP_MPARAM1 = 'OK';
    const COMP_MESSAGE = util.format(COMP_MFORMAT, COMP_MPARAM1);

    status.setComponentOk(COMP_NAME, COMP_MFORMAT, COMP_MPARAM1);

    return request(handler)
      .get('/status/json')
      .set('Accept', 'application/json')
      .expect(jsonschema.checkValid('status'))
      .expect((res: request.Response) => {
        let data = <status.ApplicationStatus> res.body;
        assert.equal(data.status, 'OK', 'Expected application status is "OK"');
        let found = 0;
        for (let comp of data.components) {
          if (comp.name === COMP_NAME) {
            found += 1;
            assert.equal(comp.status, 'OK', 'Expected component status is "OK"');
            assert.equal(comp.message, COMP_MESSAGE, util.format('Expected component message is "%s"', COMP_MESSAGE));
          }
        }
        assert.equal(found, 1, util.format('Component "%s" not found', COMP_NAME));
      });
  });

  it('Set component status "ERROR"', function() {
    const COMP_NAME = 'Test Comp';
    const COMP_MFORMAT = 'Test Message: %s';
    const COMP_MPARAM1 = 'ERROR';
    const COMP_MESSAGE = util.format(COMP_MFORMAT, COMP_MPARAM1);

    status.setComponentError(COMP_NAME, COMP_MFORMAT, COMP_MPARAM1);

    return request(handler)
      .get('/status/json')
      .set('Accept', 'application/json')
      .expect(jsonschema.checkValid('status'))
      .expect((res: request.Response) => {
        let data = <status.ApplicationStatus> res.body;
        assert.equal(data.status, 'ERROR', 'Expected application status is "ERROR"');
        let found = 0;
        for (let comp of data.components) {
          if (comp.name === COMP_NAME) {
            found += 1;
            assert.equal(comp.status, 'ERROR', 'Expected component status is "ERROR"');
            assert.equal(comp.message, COMP_MESSAGE, util.format('Expected component message is "%s"', COMP_MESSAGE));
          }
        }
        assert.equal(found, 1, util.format('Component "%s" not found', COMP_NAME));
      });
  });

  it('Restore component status "OK"', function() {
    const COMP_NAME = 'Test Comp';
    const COMP_MFORMAT = 'Test Message: %s';
    const COMP_MPARAM1 = 'OK (again)';
    const COMP_MESSAGE = util.format(COMP_MFORMAT, COMP_MPARAM1);

    status.setComponentOk(COMP_NAME, COMP_MFORMAT, COMP_MPARAM1);

    return request(handler)
      .get('/status/json')
      .set('Accept', 'application/json')
      .expect(jsonschema.checkValid('status'))
      .expect((res: request.Response) => {
        let data = <status.ApplicationStatus> res.body;
        assert.equal(data.status, 'OK', 'Expected application status is "OK"');
        let found = 0;
        for (let comp of data.components) {
          if (comp.name === COMP_NAME) {
            found += 1;
            assert.equal(comp.status, 'OK', 'Expected component status is "OK"');
            assert.equal(comp.message, COMP_MESSAGE, util.format('Expected component message is "%s"', COMP_MESSAGE));
          }
        }
        assert.equal(found, 1, util.format('Component "%s" not found', COMP_NAME));
      });
  });
});
