/**
 * Test for Software Installation history.
 */
import {expect} from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import * as mongoose from 'mongoose';

import * as SuperTest from 'supertest';

import { Update } from '../app/shared/history';

import * as server from './app';

import * as data from './data';
import * as cookies from './lib/cookies';
import { checkHistory } from './lib/testing';

const debug = Debug('swdb:routes:history-swinstalls-test');

const props = data.PROPS;

const historyCount = data.SOFTWARES.length + data.SWINSTALLS.length;


describe('Installations history tests suite',  () => {
  let app: Application;
  let cookie: string;
  let supertest: SuperTest.SuperTest<SuperTest.Test>;

  before('Start Application', async () => {
    app = await server.start();
    supertest = SuperTest(app);
  });

  before('Init Database', async () => {
    await data.initialize();
  });

  before('Get User Session Cookie', async () => {
    const res = await supertest.get('/login')
      .auth(props.test.username, props.test.password).expect(302);
    cookie = cookies.parseCookie(res, 'connect.sid', true).cookieString();
  });

  after('Stop Application', async () => {
    await server.stop();
  });


  const wrapper = { origId: null };


  it('Check initial number of history updates', async () => {
    const count = await Update.count({}).exec();
    expect(count).to.equal(historyCount);
  });

  it('Post a new record with correct history', async () => {
    const result = await supertest
      .post('/api/v1/inst')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .send({
        host: 'Test host',
        name: 'Test name',
        area: [ 'Global' ],
        status: 'RDY_INST',
        statusDate: '2017-04-21',
        software: '5947589458a6aa0face9a512',
        vvResultsLoc: [],
        vvApprovalDate: '',
        drrs: '',
      })
      .expect(201);

    const id = result.header.location.split(/\//).pop();
    wrapper.origId = id;
    debug('Got id ' + id);
    const canonObj: any = {
      host: 'Test host',
      name: 'Test name',
      area: [ 'Global' ],
      status: 'RDY_INST',
      statusDate: new Date('2017-04-21'),
      software: new mongoose.mongo.ObjectId('5947589458a6aa0face9a512'),
    };

    expect(await checkHistory(debug, canonObj, id)).to.equal('History record matches');
  });

  it('Update an installation record with correct history', (done) => {
    supertest
      .put('/api/v1/inst/' + wrapper.origId)
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        name: 'New test name',
        host: 'Test host',
        area: [ 'Global' ],
        status: 'RDY_INST',
        statusDate: '2017-04-21',
        software: '5947589458a6aa0face9a512',
        vvResultsLoc: [],
        vvApprovalDate: '',
        drrs: '',
      })
      .end(async (err, result) => {
        // get record id from the returned location and find records that match
        const id = result.header.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        const canonObj: any  = {
          name: 'New test name',
        };
        try {
          expect(await checkHistory(debug, canonObj, id)).to.equal('History record matches');
          done();
        } catch (err) {
          done(err);
        }
      });
  });
});
