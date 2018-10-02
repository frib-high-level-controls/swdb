/**
 * Test for Software history.
 */
import {expect} from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';

import * as SuperTest from 'supertest';

import { Update } from '../app/shared/history';

import * as server from './app';

import * as data from './data';
import * as cookies from './lib/cookies';
import { checkHistory } from './lib/testing';

const debug = Debug('swdb:routes:history-softwares-test');

const props = data.PROPS;


describe('History tests suite', () => {
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
    expect(count).to.equal(18);
  });

  it('Post a new record with correct history', (done) => {
    supertest
      .post('/api/v1/swdb')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        name: 'Test Record',
        desc: '',
        branch: '',
        version: '',
        owner: 'Owner 1000',
        engineer: 'Engineer 1000',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        platforms: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .end(async (err, result) => {
        if (err) {
          done(err);
        } else {
          // get record id from the returned location and find records that match
          const id = result.header.location.split(/\//).pop();
          wrapper.origId = id;
          debug('Got id ' + id);
          const canonObj = {
            name: 'Test Record', owner: 'Owner 1000', engineer: 'Engineer 1000',
            levelOfCare: 'LOW', status: 'DEVEL', statusDate: new Date('2017-04-21'),
          };
          try {
            expect(await checkHistory(debug, canonObj, id)).to.equal('History record matches');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
  });

  it('Update a software record with correct history', (done) => {
    supertest
      .put('/api/v1/swdb/' + wrapper.origId)
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        owner: 'New test owner',
        name: 'Test Record',
        desc: '',
        branch: '',
        version: '',
        engineer: 'Engineer 1000',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        platforms: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .end(async (err, result) => {
        // get record id from the returned location and find records that match
        const id = result.header.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        const canonObj = {
            owner: 'New test owner',
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
