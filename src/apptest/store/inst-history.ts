import server = require('../../app/server');
import Chai = require('chai');
let expect = Chai.expect;
import Supertest = require('supertest');
import Be = require('../../app/lib/Db');
import mongoose = require('mongoose');
import TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();
import CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
import dbg = require('debug');
const debug = dbg('swdb:inst-history-tests');
let props: any = {};
props = ctools.getConfiguration();

let app;
let Cookies: any;

describe('Installations history tests suite', function () {
  let supertest: any = null;
  before('Prep DB', async function () {
    app = await server.start();
    supertest = Supertest(app);
    debug('Prep DB');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async function () {
    debug('Clear DB');
    // clear the test collection
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  let wrapper = { origId: null };

  before('login as test user', function(done){
    this.timeout(8000);
    supertest
    .get('/login')
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end(function(err: Error, res: Express.Session){
      if (err) {
        done(err);
      } else {
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + JSON.stringify(Cookies));
        done();
      }
    });
  });

  it('Has the blank history', async function () {
    let cursor = Be.Db.swDoc.db.collections.history.find();
    let count: number;
    if (cursor) {
      count = await cursor.count();
      debug('Found ' + count + ' items');
      expect(count).to.equal(0);
    } else {
      debug('Installation history collection is empty');
      expect(count = 0).to.equal(0);
    }
  });

  it('Post a new record with correct history', function (done) {
    supertest
      .post('/api/v1/inst')
      .set('Accept', 'application/json')
      .set('Cookie', [Cookies])
      .send({
       host: 'Test host',
       name: 'Test name',
       area: [ 'Global' ],
       status: 'RDY_INST',
       statusDate: 'date 1000',
       software: '5947589458a6aa0face9a512'})
      .end(async (err: Error, result: Express.Session) => {
        // get record id from the returned location and find records that match
        let id = result.headers.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        let canonObj: any = {
           host: 'Test host',
           name: 'Test name',
           area: [ 'Global' ],
           status: 'RDY_INST',
           statusDate: new Date('date 1000'),
           software: new mongoose.mongo.ObjectId('5947589458a6aa0face9a512')};
        try {
          expect(await testTools.checkHistory(debug, canonObj, id)).to.equal('History record matches');
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('Update an installation record with correct history', function (done) {
    supertest
      .put('/api/v1/inst/' + wrapper.origId)
      .set('Accept', 'application/json')
      .set('Cookie', [Cookies])
      .send( { name: 'New test name' } )
      .end(async (err: Error, result: Express.Session) => {
        // get record id from the returned location and find records that match
        let id = result.headers.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        let canonObj: any  = {
          name: 'New test name',
        };
        try {
          expect(await testTools.checkHistory(debug, canonObj, id)).to.equal('History record matches');
          done();
        } catch (err) {
          done(err);
        }
      });
  });
});
