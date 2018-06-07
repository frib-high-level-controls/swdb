/**
 * Test the application status REST API
 */
import * as util from 'util';

import { assert } from 'chai';
import * as express from 'express';
import * as request from 'supertest';

import * as app from './app';
import * as jsonschema from './shared/jsonschema';

import * as status from '../app/shared/status';


describe('Application status API', () => {

  let handler: express.Application;

  before(async () => {
    handler = await app.start();
  });

  after(async () => {
    await app.stop();
  });

  it('Get application status', () => {
    return request(handler)
      .get('/status')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(jsonschema.checkValid('/status'))
      .expect((res: request.Response) => {
        const data = res.body as status.ApplicationStatus;
        assert.equal(data.status, 'OK', 'Expected application status is "OK"');
      });
  });

  it('Set component status "OK"', () => {
    const COMP_NAME = 'Test Comp';
    const COMP_MFORMAT = 'Test Message: %s';
    const COMP_MPARAM1 = 'OK';
    const COMP_MESSAGE = util.format(COMP_MFORMAT, COMP_MPARAM1);

    status.setComponentOk(COMP_NAME, COMP_MFORMAT, COMP_MPARAM1);

    return request(handler)
      .get('/status')
      .set('Accept', 'application/json')
      .expect(jsonschema.checkValid('/status'))
      .expect((res: request.Response) => {
        const data = res.body as status.ApplicationStatus;
        assert.equal(data.status, 'OK', 'Expected application status is "OK"');
        let found = 0;
        for (const comp of data.components) {
          if (comp.name === COMP_NAME) {
            found += 1;
            assert.equal(comp.status, 'OK', 'Expected component status is "OK"');
            assert.equal(comp.message, COMP_MESSAGE, util.format('Expected component message is "%s"', COMP_MESSAGE));
          }
        }
        assert.equal(found, 1, util.format('Component "%s" not found', COMP_NAME));
      });
  });

  it('Set component status "ERROR"', () => {
    const COMP_NAME = 'Test Comp';
    const COMP_MFORMAT = 'Test Message: %s';
    const COMP_MPARAM1 = 'ERROR';
    const COMP_MESSAGE = util.format(COMP_MFORMAT, COMP_MPARAM1);

    status.setComponentError(COMP_NAME, COMP_MFORMAT, COMP_MPARAM1);

    return request(handler)
      .get('/status')
      .set('Accept', 'application/json')
      .expect(jsonschema.checkValid('/status'))
      .expect((res: request.Response) => {
        const data = res.body as status.ApplicationStatus;
        assert.equal(data.status, 'ERROR', 'Expected application status is "ERROR"');
        let found = 0;
        for (const comp of data.components) {
          if (comp.name === COMP_NAME) {
            found += 1;
            assert.equal(comp.status, 'ERROR', 'Expected component status is "ERROR"');
            assert.equal(comp.message, COMP_MESSAGE, util.format('Expected component message is "%s"', COMP_MESSAGE));
          }
        }
        assert.equal(found, 1, util.format('Component "%s" not found', COMP_NAME));
      });
  });

  it('Restore component status "OK"', () => {
    const COMP_NAME = 'Test Comp';
    const COMP_MFORMAT = 'Test Message: %s';
    const COMP_MPARAM1 = 'OK (again)';
    const COMP_MESSAGE = util.format(COMP_MFORMAT, COMP_MPARAM1);

    status.setComponentOk(COMP_NAME, COMP_MFORMAT, COMP_MPARAM1);

    return request(handler)
      .get('/status')
      .set('Accept', 'application/json')
      .expect(jsonschema.checkValid('/status'))
      .expect((res: request.Response) => {
        const data = res.body as status.ApplicationStatus;
        assert.equal(data.status, 'OK', 'Expected application status is "OK"');
        let found = 0;
        for (const comp of data.components) {
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
