import Chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import Supertest = require('supertest');
import Be = require('../../app/lib/Db');
import TestTools = require('./TestTools');
// const circJSON = require('circular-json');

import CommonTools = require('../../app/lib/CommonTools');
import server = require('../../app/server');
const ctools = new CommonTools.CommonTools();
let props: CommonTools.IProps;
props = ctools.getConfiguration();
import dbg = require('debug');
const debug = dbg('swdb:swdb-history-tests');
let app;
let supertest: Supertest.SuperTest<Supertest.Test>;
const testTools = new TestTools.TestTools();
Chai.use(chaiAsPromised);
const expect = Chai.expect;

let Cookies: string;
//
describe('History tests suite', () => {
  before('Prep DB', async () => {
    app = await server.start();
    supertest = Supertest(app);
    debug('Prep DB');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async () => {
    debug('Clear DB');
    // clear the test collection
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  // describe("Login and perform history tests", function () {
  const wrapper = { origId: null };

  before('login as test user', function(this, done) {
    this.timeout(8000);
    supertest
    .get('/login')
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end((err, res) => {
      if (err) {
        done(err);
      } else {
        Cookies = res.header['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + JSON.stringify(Cookies));
        done();
      }
    });
  });

  it('Has the blank history', async () => {
    const cursor = Be.Db.swDoc.db.collections.history.find();
    const count: number = await cursor.count();
    debug('Found ' + count + ' history items');
    expect(count).to.equal(0);
  });

  it('Post a new record with correct history', (done) => {
    supertest
      .post('/api/v1/swdb')
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .send({ swName: 'Test Record', owner: 'Owner 1000', engineer: 'Engineer 1000',
       levelOfCare: 'LOW', status: 'DEVEL', statusDate: '2017-04-21' })
      .end(async (err: Error, result: Supertest.Response) => {
        if (err) {
          done(err);
        } else {
          // get record id from the returned location and find records that match
          const id = result.header.location.split(/\//).pop();
          wrapper.origId = id;
          debug('Got id ' + id);
          const canonObj = {
            swName: 'Test Record', owner: 'Owner 1000', engineer: 'Engineer 1000',
            levelOfCare: 'LOW', status: 'DEVEL', statusDate: new Date('2017-04-21'),
          };
          try {
            expect(await testTools.checkHistory(debug, canonObj, id)).to.equal('History record matches');
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
      .set('Cookie', Cookies)
      .send( { owner: 'New test owner' } )
      .end(async (err: Error, result: Supertest.Response) => {
        // get record id from the returned location and find records that match
        const id = result.header.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        const canonObj = {
            owner: 'New test owner',
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
