/**
 * Test for Software API specification.
 */

/* tslint:disable:max-line-length */

import { assert, expect } from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import { assign } from 'lodash';

import * as SuperTest from 'supertest';

import { Update } from '../app/shared/history';

import * as server from './app';

import * as data from './data';
import * as cookies from './lib/cookies';

const debug = Debug('swdb:routes:api-softwares-test');

const props = data.PROPS;

const historyCount = data.SOFTWARES.length + data.SWINSTALLS.length;


describe('Software API Specification', () => {
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


  // web facing tests
  it('Respond with welcome', (done) => {
    supertest
    .get('/')
    .expect(200)
    .end((err, res) => {
      expect(res.text).to.match(/SWDB \(Prototype Interface\)/);
      done(err);
    });
  });
  it('Returns all sw records', (done) => {
    supertest
    .get('/api/v1/swdb')
    .expect(200)
    .end((err, res) => {
      if (err) {
        done(err);
      } else {
        expect(res.text).to.match(/\[*\]/);
        done();
      }
    });
  });

  it('Returns FORG user records', (done) => {
    supertest
    .get('/api/v1/swdb/forgUsers')
    .expect(200)
    .end((err, res) => {
      if (err) {
        done(err);
      } else {
        try {
          const sub = JSON.parse(res.text).filter((element: any, idx: number, array: object[]) => {
            return element.uid === 'FEDM';
          });
          if (sub.length === 1) {
            done();
          } else {
            debug('Got filtered array ' + JSON.stringify(sub));
            done(new Error('Cannot find expected user "FEDM"'));
          }
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('Returns FORG group records', (done) => {
    supertest
    .get('/api/v1/swdb/forgGroups')
    .expect(200)
    .end((err, res) => {
      if (err) {
        done(err);
      } else {
        try {
          const sub = JSON.parse(res.text).filter((element: any, idx: number, array: object[]) => {
            return element.uid === 'ISF:LAB.DIV.FE';
          });
          if (sub.length === 1) {
            done();
          } else {
            debug('Got filtered array ' + JSON.stringify(sub));
            done(new Error('Cannot find expected user "ISF:LAB.DIV.FE"'));
          }
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('Returns FORG area records', (done) => {
    supertest
    .get('/api/v1/swdb/forgAreas')
    .expect(200)
    .end((err, res) => {
      if (err) {
        done(err);
      } else {
        try {
          const sub = JSON.parse(res.text).filter((element: any, idx: number, array: object[]) => {
            return element.uid === 'ADB:FRONT_END';
          });
          if (sub.length === 1) {
            done();
          } else {
            debug('Got filtered array ' + JSON.stringify(sub));
            done(new Error('Cannot find expected user "ADB:FRONT_END"'));
          }
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('Has the blank history', async () => {
    const count = await Update.count({}).exec();
    debug('Found ' + count + ' items');
    expect(count).to.equal(historyCount);
  });

  it('Returns location header posting new record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        swName: 'Header Test Record',
        desc: '',
        branch: '',
        version: '',
        owner: 'Owner 1000',
        engineer: 'Engineer 1000',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        designDescDocLoc: '',
        descDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        versionControl: '',
        versionControlLoc: '',
        platforms: '',
        comment: '',
      })
      .expect(201)
      .end((err, result) => {
        if (err) {
          debug('result: ' + JSON.stringify(result.text));
          done(err);
        } else {
          debug('result: ' + JSON.stringify(result));
          if (result.header.location.match(/^.*\/api\/v1\/swdb\/[0-9a-fA-F]{24}$/g)) {
            done();
          } else {
            done(new Error('Location header is not set' + JSON.stringify(result.header.location)));
          }
        }
      });
  });

  it('Has the correct number of history entries', async () => {
    const count = await Update.count({}).exec();
    debug('Found ' + count + ' items');
    expect(count).to.equal(historyCount + 1);
  });

  it('Has the swName history entry', async () => {
    const updates = await Update.find().exec();
    const doc = updates[updates.length - 1];
    debug('Document history: ' + JSON.stringify(doc));
    expect(doc.paths[0].name).to.equal('swName');
  });

  it('Has the correct swName history entry', async () => {
    const updates = await Update.find().exec();
    const doc = updates[updates.length - 1];
    expect(doc.paths[0].value).to.equal('Header Test Record');
  });


  describe('Check location headers', () => {
    const wrapper = {origId: null};
    before('Get ID record id:Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'Header Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id:Header Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('Header Test Record');
          expect(res.body._id).to.match(/.{24}/);
          done();
        }
      });
    });

    it('Returns the correct location header PUT existing record', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Header owner',
          swName: 'Header Test Record',
          desc: '',
          branch: '',
          version: '',
          engineer: 'Engineer 1000',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            const re = new RegExp('^.*/api/v1/swdb/' + wrapper.origId + '$');
            if (result.header.location.match(re)) {
              debug('Location: ' + result.header.location);
              done();
            } else {
              done(new Error('Location header is not set' + JSON.stringify(result.header.location)));
            }
          }
        });
    });
  });

  describe('Check history calls', () => {
    const wrapper = { origId: null };
    before('Before test post and get id', (done) => {
      supertest
        .post('/api/v1/swdb')
        .send({
          swName: 'Hist1 Test Record',
          owner: 'Test Owner',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(201)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.header.location);
            const urlParts = result.header.location.split('/');
            wrapper.origId = urlParts[urlParts.length - 1];
            done();
          }
        });
    });
    before('Before modify test record (history2)', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Hist2 owner',
          swName: 'Hist1 Test Record',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history 3)', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Hist3 owner',
          swName: 'Hist1 Test Record',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history 4)', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Hist4 owner',
          swName: 'Hist1 Test Record',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history 5)', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Hist5 owner',
          swName: 'Hist1 Test Record',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history 6)', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Hist6 owner',
          swName: 'Hist1 Test Record',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history 7)', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          owner: 'Hist7 owner',
          swName: 'Hist1 Test Record',
          engineer: 'Test Engineer',
          previous: 'badbeefbadbeefbadbeefbad',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          desc: '',
          branch: '',
          version: '',
          designDescDocLoc: '',
          descDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          platforms: '',
          comment: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });

    it('The API default history entry is correct',  (done) => {
      supertest
        .get('/api/v1/swdb/hist/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            debug('Err history (api test): ' + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug('got history (api test): ' + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(5);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter((x: any) => x.name === 'owner');
            // check that history item has the expected value
            expect(arr[0].value).to.equal('Hist7 owner');
            done();
          }
        });
    });
    it('The API history (limit 1, skip1) entry is correct', (done) => {
      supertest
        .get('/api/v1/swdb/hist/' + wrapper.origId + '?limit=1&skip=1')
        .expect(200)
        .end((err, res) => {
          if (err) {
            debug('Err history (api test): ' + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug('got history rapi test): ' + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(1);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter((x: any) => x.name === 'owner');
            // check that history item has the expected value
            expect(arr[0].value).to.equal('Hist6 owner');
            done();
          }
        });
    });
  });

  it('Post a new record', async () => {
    const result = await supertest
      .post('/api/v1/swdb')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        swName: 'Test Record',
        desc: '',
        branch: '',
        version: '',
        owner: 'Owner 1000',
        engineer: 'Engineer 1000',
        levelOfCare: 'LOW',
        platforms: '',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .expect(201);
    debug('Location: ' + result.header.location);
  });

  it('Errors posting a duplicate new record', async () => {
    const result = await supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'Test Record',
        desc: '',
        branch: '',
        version: '',
        owner: 'Owner 1000',
        engineer: 'Engineer 1000',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(500);

    if ((result.text.match(/^E11000 duplicate key error*/g)) && (result.status === 500)) {
      debug('Got ""E11000 duplicate key error"');
    } else {
      throw new Error('no error found');
    }
  });

  it('Post a new record Test Record2', async () => {
    const result = await supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'Test Record2',
        desc: '',
        branch: '',
        version: '',
        owner: 'Owner 1002',
        engineer: 'Engineer 1002',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '1970-01-01',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201);
    debug('Location: ' + result.header.location);
  });

  describe('get id for Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id:Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id:Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('Test Record');
          expect(res.body._id).to.match(/.{24}/);
          done();
        }
      });
    });
  });

  it('Post a new record Desc Test Record', async () => {
    const result = await supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'Desc Test Record',
        owner: 'Owner 1002',
        engineer: 'Engineer 1002',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        desc: '',
        branch: '',
        version: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201);
    debug('Location: ' + result.header.location);
  });

  describe('get id for Desc Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: Desc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'Desc Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: Desc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('Desc Test Record');
          expect(res.body._id).to.match(/.{24}/);
          done();
        }
      });
    });
  });

  it('Post a new record Engineer Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'Engineer Test Record',
        owner: 'Owner 1002',
        engineer: 'Any Engineer',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        desc: '',
        branch: '',
        version: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
    })
    .set('Accept', 'application/json')
    .set('Cookie', cookie)
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.header.location);
        done();
      }
    });
  });

  describe('get id for Engineer Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: Engineer Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'Engineer Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: Engineer Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('Engineer Test Record');
          expect(res.body.engineer).to.equal('Any Engineer');
          expect(res.body._id).to.match(/.{24}/);
          done();
        }
      });
    });
  });

  it('Post a new record versionControlLoc Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'versionControlLoc Test Record',
        owner: 'versioControlLoc Test Owner',
        engineer: 'Test Engineer',
        versionControlLoc: 'http://www.somehost/some-path/some-file',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        desc: '',
        branch: '',
        version: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        comment: '',
    })
    .set('Accept', 'application/json')
    .set('Cookie', cookie)
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.header.location);
        done();
      }
    });
  });

  describe('get id for versionControlLoc Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: versionControlLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'versionControlLoc Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: versionControlLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('versionControlLoc Test Record');
          expect(res.body.versionControlLoc).to.equal('http://www.somehost/some-path/some-file');
          done();
        }
      });
    });
  });

  it('Post a new record designDescDocLoc Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'designDescDocLoc Test Record',
        owner: 'designDescDocLoc Test Owner',
        engineer: 'Test Engineer',
        designDescDocLoc: 'http://www.somehost/some-path/some-file',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        desc: '',
        branch: '',
        version: '',
        descDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201)
      .end((err, result) => {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + result.header.location);
          done();
        }
      });
  });

  describe('get id for designDescDocLoc Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: designDescDocLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'designDescDocLoc Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: designDescDocLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('designDescDocLoc Test Record');
          expect(res.body.designDescDocLoc).to.equal('http://www.somehost/some-path/some-file');
          done();
        }
      });
    });
  });

  it('Post a new record descDocLoc Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'descDocLoc Test Record',
        owner: 'descDocLoc Test Owner',
        engineer: 'Test Engineer',
        descDocLoc: 'http://www.somehost/some-path/some-file',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '2017-04-21',
        desc: '',
        branch: '',
        version: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201)
      .end((err, result) => {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + result.header.location);
          done();
        }
      });
  });

  describe('get id for descDocLoc Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: descDocLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'descDocLoc Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: descDocLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('descDocLoc Test Record');
          expect(res.body.descDocLoc).to.equal('http://www.somehost/some-path/some-file');
          done();
        }
      });
    });
  });

  it('Post a new record vvProcLoc Test Record', (done) => {
    supertest
    .post('/api/v1/swdb')
    .send({
      swName: 'vvProcLoc Test Record',
      owner: 'vvProcLoc Test Owner',
      engineer: 'Test Engineer',
      vvProcLoc: ['http://www.somehost/some-path/some-file', 'http://www.somehost/some-path/some-file2'],
      levelOfCare: 'LOW',
      status: 'DEVEL',
      statusDate: '1970-01-01',
      desc: '',
      branch: '',
      version: '',
      descDocLoc: '',
      designDescDocLoc: '',
      vvResultsLoc: [],
      platforms: '',
      versionControl: '',
      versionControlLoc: '',
      comment: '',
    })
    .set('Accept', 'application/json')
    .set('Cookie', cookie)
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.header.location);
        done();
      }
    });
  });

  describe('get id for vvProcLoc Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: vvProcLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'vvProcLoc Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: vvProcLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          debug('res: ' + JSON.stringify(res.body));
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('vvProcLoc Test Record');
          expect(JSON.stringify(res.body.vvProcLoc))
            .to.equal('["http://www.somehost/some-path/some-file","http://www.somehost/some-path/some-file2"]');
          done();
        }
      });
    });
  });

  it('Post a new record vvResultsLoc Test Record', (done) => {
    supertest
    .post('/api/v1/swdb')
    .send({
      swName: 'vvResultsLoc Test Record',
      owner: 'vvResultsLoc Test Owner',
      engineer: 'Test Engineer',
      vvResultsLoc: [ 'http://www.somehost/some-path/some-file3', 'http://www.somehost/some-path/some-file4' ],
      levelOfCare: 'LOW',
      status: 'DEVEL',
      statusDate: '1970-01-01',
      desc: '',
      branch: '',
      version: '',
      descDocLoc: '',
      designDescDocLoc: '',
      vvProcLoc: [],
      platforms: '',
      versionControl: '',
      versionControlLoc: '',
      comment: '',
    })
    .set('Accept', 'application/json')
    .set('Cookie', cookie)
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.header.location);
        done();
      }
    });
  });

  describe('get id for vvResultsLoc Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: vvResultsLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'vvResultsLoc Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: vvResultsLoc Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('vvResultsLoc Test Record');
          expect(JSON.stringify(res.body.vvResultsLoc))
            .to.equal('["http://www.somehost/some-path/some-file3","http://www.somehost/some-path/some-file4"]');
          done();
        }
      });
    });
  });

  it('Post a new record branch Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'branch Test Record',
        owner: 'branch Test Owner',
        engineer: 'Test Engineer',
        branch: 'New branch',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '1970-01-01',
        desc: '',
        version: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201)
      .end((err, result) => {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + result.header.location);
          done();
        }
      });
  });

  describe('get id for branch Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID record id: branch Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'branch Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: branch Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('branch Test Record');
          expect(res.body.branch).to.equal('New branch');
          done();
        }
      });
    });
  });

  it('Post a new record versionControl Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'versionControl Test Record',
        owner: 'versionControl Test Owner',
        engineer: 'Test Engineer',
        versionControl: 'GIT',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '1970-01-01',
        desc: '',
        branch: '',
        version: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201)
      .end((err, result) => {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + result.header.location);
          done();
        }
      });
  });

  describe('get id for versionControl Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID versionControl id: branch Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'versionControl Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: versionControl Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('versionControl Test Record');
          expect(res.body.versionControl).to.equal('GIT');
          done();
        }
      });
    });
  });

  it('Post a new record previous Test Record', (done) => {
    supertest
      .post('/api/v1/swdb')
      .send({
        swName: 'previous Test Record',
        owner: 'previous Test Owner',
        engineer: 'Test Engineer',
        previous: 'badbeefbadbeefbadbeefbad',
        levelOfCare: 'LOW',
        status: 'DEVEL',
        statusDate: '1970-01-01',
        desc: '',
        branch: '',
        version: '',
        descDocLoc: '',
        designDescDocLoc: '',
        vvProcLoc: [],
        vvResultsLoc: [],
        platforms: '',
        versionControl: '',
        versionControlLoc: '',
        comment: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201)
      .end((err, result) => {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + result.header.location);
          done();
        }
      });
  });

  describe('get id for previous Test Record', () => {
    const wrapper = {origId: null};
    before('Get ID previous id: branch Test Record', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'previous Test Record') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Returns test record id: previous Test Record', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('previous Test Record');
          expect(res.body.previous).to.equal('badbeefbadbeefbadbeefbad');
          done();
        }
      });
    });
  });


  describe('get id for Test Record2', () => {
    let wrapper: any = {origId: null};
    before('Get ID record id:Test Record2', (done) => {
      supertest
      .get('/api/v1/swdb')
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const result = JSON.parse(res.text);
          for (let i = 0, iLen = result.length; i < iLen; i++) {
            if (result[i].swName === 'Test Record2') {
              wrapper.origId = result[i]._id;
            }
          }
          done();
        }
      });
    });

    it('Can update a record via PUT swName id:Test Record3', (done) => {
      supertest
        .put('/api/v1/swdb/' + wrapper.origId)
        .send({
          swName: 'Test Record3',
          desc: '',
          branch: '',
          version: '',
          owner: 'Owner 1002',
          engineer: 'Engineer 1002',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '1970-01-01',
          descDocLoc: '',
          designDescDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          platforms: '',
          versionControl: '',
          versionControlLoc: '',
          comment: '',
        })
        .set('Cookie', cookie)
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.header.location);
            done();
          }
        });
    });

    it('Returns test record 1d:Test Record3', (done) => {
      supertest
      .get('/api/v1/swdb/' + wrapper.origId)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property('_id');
          expect(res.body.swName).to.equal('Test Record3');
          done();
        }
      });
    });

    // workflow rule1 tests
    it('Post a new record to test version/branch lock on Ready for install(rule 1)', (done) => {
      supertest
        .post('/api/v1/swdb')
        .send({
          swName: 'Rule 1 Test Record',
          owner: 'previous Test Owner',
          engineer: 'Test Engineer',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '1970-01-01',
          desc: '',
          branch: '',
          version: '',
          descDocLoc: '',
          designDescDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          platforms: '',
          versionControl: '',
          versionControlLoc: '',
          comment: '',
        })
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(201)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.header.location);
            done();
          }
        });
    });

    describe('get id for rule 1 record', () => {
      wrapper = { origId: null };
      before('Get ID previous id: rule 1 Test Record', (done) => {
        supertest
          .get('/api/v1/swdb')
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              const result = JSON.parse(res.text);
              for (let i = 0, iLen = result.length; i < iLen; i++) {
                if (result[i].swName === 'Rule 1 Test Record') {
                  wrapper.origId = result[i]._id;
                }
              }
              done();
            }
          });
      });

      it('Returns test record id: previous Test Record', (done) => {
        supertest
          .get('/api/v1/swdb/' + wrapper.origId)
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              expect(res.body).to.have.property('_id');
              expect(res.body.swName).to.equal('Rule 1 Test Record');
              done();
            }
          });
      });

      it('set version branch in rule 1 Test Record', (done) => {
        supertest
          .put('/api/v1/swdb/' + wrapper.origId)
          .send({
            version: 'Test version',
            branch: 'Test branch',
            swName: 'Rule 1 Test Record',
            owner: 'previous Test Owner',
            engineer: 'Test Engineer',
            levelOfCare: 'LOW',
            status: 'DEVEL',
            statusDate: '1970-01-01',
            desc: '',
            descDocLoc: '',
            designDescDocLoc: '',
            vvProcLoc: [],
            vvResultsLoc: [],
            platforms: '',
            versionControl: '',
            versionControlLoc: '',
            comment: '',
          })
          .set('Cookie', cookie)
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              done();
            }
          });
      });

      it('set status in rule 1 Test Record', (done) => {
        supertest
          .put('/api/v1/swdb/' + wrapper.origId)
          .send({
            status: 'RDY_INST',
            version: 'Test version',
            branch: 'Test branch',
            swName: 'Rule 1 Test Record',
            owner: 'previous Test Owner',
            engineer: 'Test Engineer',
            levelOfCare: 'LOW',
            statusDate: '1970-01-01',
            desc: '',
            descDocLoc: '',
            designDescDocLoc: '',
            vvProcLoc: [],
            vvResultsLoc: [],
            platforms: '',
            versionControl: '',
            versionControlLoc: '',
            comment: '',
          })
          .set('Cookie', cookie)
          .expect(200)
          .end((err, res) => {
            if (res.status >= 400) {
              debug('Response: %s', res.text);
            }
            if (err) {
              done(err);
            } else {
              done();
            }
          });
      });

      it('Returns test record id: previous Test Record', (done) => {
        supertest
          .get('/api/v1/swdb/' + wrapper.origId)
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              expect(res.body).to.have.property('_id');
              expect(res.body.status).to.equal('RDY_INST');
              done();
            }
          });
      });

      it('set version/branch in rule 1 Test Record', (done) => {
        supertest
          .put('/api/v1/swdb/' + wrapper.origId)
          .send({
            version: 'Test version2',
            branch: 'Test branch2',
            status: 'RDY_INST',
            swName: 'Rule 1 Test Record',
            owner: 'previous Test Owner',
            engineer: 'Test Engineer',
            levelOfCare: 'LOW',
            statusDate: '1970-01-01',
            desc: '',
            descDocLoc: '',
            designDescDocLoc: '',
            vvProcLoc: [],
            vvResultsLoc: [],
            platforms: '',
            versionControl: '',
            versionControlLoc: '',
            comment: '',
          })
          .set('Cookie', cookie)
          .expect(400)
          .expect('Worklow validation errors: "Version and branch cannot change in state RDY_INST"')
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              done();
            }
          });
      });
    });

    // workflow rule4 tests
    it('Post a new record to test status lock if installations (rule 4)', (done) => {
      supertest
        .post('/api/v1/swdb')
        .send({
          swName: 'Rule 4 Test Record',
          version: 'test version',
          branch: 'test branch',
          owner: 'previous Test Owner',
          engineer: 'Test Engineer',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '1970-01-01',
          desc: '',
          descDocLoc: '',
          designDescDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          platforms: '',
          versionControl: '',
          versionControlLoc: '',
          comment: '',
        })
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(201)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.header.location);
            done();
          }
        });
    });

    describe('get id for rule 4 record', () => {
      wrapper = { origId: null };
      before('Get ID previous id: rule 4 Test Record', (done) => {
        supertest
          .get('/api/v1/swdb')
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              const result = JSON.parse(res.text);
              for (let i = 0, iLen = result.length; i < iLen; i++) {
                if (result[i].swName === 'Rule 4 Test Record') {
                  wrapper.origId = result[i]._id;
                }
              }
              done();
            }
          });
      });

      it('Returns test record id: Rule 4 Test Record', (done) => {
        supertest
          .get('/api/v1/swdb/' + wrapper.origId)
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              expect(res.body).to.have.property('_id');
              expect(res.body.swName).to.equal('Rule 4 Test Record');
              done();
            }
          });
      });

      it('set status in rule 4 Test Record', (done) => {
        supertest
          .put('/api/v1/swdb/' + wrapper.origId)
          .send({
            status: 'RDY_INST',
            swName: 'Rule 4 Test Record',
            version: 'test version',
            branch: 'test branch',
            owner: 'previous Test Owner',
            engineer: 'Test Engineer',
            levelOfCare: 'LOW',
            statusDate: '1970-01-01',
            desc: '',
            descDocLoc: '',
            designDescDocLoc: '',
            vvProcLoc: [],
            vvResultsLoc: [],
            platforms: '',
            versionControl: '',
            versionControlLoc: '',
            comment: '',
          })
          .set('Cookie', cookie)
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              done();
            }
          });
      });

      it('Rule 4 test - Post a new installation record', (done) => {
        supertest
          .post('/api/v1/inst')
          .set('Accept', 'application/json')
          .set('Cookie', cookie)
          .send({
            host: 'Test host',
            name: 'Test name',
            area: ['Global'],
            status: 'RDY_INST',
            statusDate: '1970-01-01',
            software: wrapper.origId,
          })
          .expect(201)
          // .end(done);
          .end((err, res) => {
            if (err) {
              debug('res: ' + JSON.stringify(res, null, 2));
              done(err);
            } else {
              // grab the new installation id from the returned location header.
              // We use this later to verify the error message.
              const id = res.header.location.split(/\//).pop();
              wrapper.instId = id;
              debug('res: ' + JSON.stringify(res, null, 2));
              done();
            }
          });
      });

      it('Rule 4 test - errors setting status having installations', (done) => {
        supertest
          .put('/api/v1/swdb/' + wrapper.origId)
          .send({
            status: 'DEVEL',
            swName: 'Rule 4 Test Record',
            version: 'test version',
            branch: 'test branch',
            owner: 'previous Test Owner',
            engineer: 'Test Engineer',
            levelOfCare: 'LOW',
            statusDate: '1970-01-01',
            desc: '',
            descDocLoc: '',
            designDescDocLoc: '',
            vvProcLoc: [],
            vvResultsLoc: [],
            platforms: '',
            versionControl: '',
            versionControlLoc: '',
            comment: '',
          })
          .set('Cookie', cookie)
          .expect(400)
          .expect('Worklow validation errors: "Software state cannot change while ' +
            'there are active installations: ' + wrapper.instId + '"')
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              done();
            }
          });
      });
    });

    const template = {
      swName: 'Rule 4 Test Record',
      version: 'test version',
      branch: 'test branch',
      owner: 'previous Test Owner',
      engineer: 'Test Engineer',
      levelOfCare: 'LOW',
      status: 'DEVEL',
      statusDate: '1970-01-01',
      desc: '',
      descDocLoc: '',
      designDescDocLoc: '',
      vvProcLoc: [],
      vvResultsLoc: [],
      platforms: '',
      versionControl: '',
      versionControlLoc: '',
      comment: '',
    };

    // This table lists test requests to make and the expected
    const table: Array<{type: string; url: string; status: number, data: any, msg?: string}> = [
      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {swName: 'Test Record4'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {swName: 'Test Record4'}},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {owner: 'New test owner 1002'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {owner: 'New test owner 1002'}},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {engineer: 'New Engineer'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {engineer: 'New Engineer'}},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {levelOfCare: 'MEDIUM'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {levelOfCare: 'MEDIUM'}},
      {type: 'PUT', url: '/api/v1/swdb/', status: 400, data: {levelOfCare: 'ERRONEOUS_VALUE'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {levelOfCare: 'MEDIUM'}},
      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {levelOfCare: 'LOW'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {levelOfCare: 'LOW'}},

      {type: 'PUT', data: {status: 'DEVEL'}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {status: 'DEVEL'}, url: '/api/v1/swdb/',  status: 200},
      {type: 'PUT', data: {status: 'ERRONEOUS_VALUE'}, url: '/api/v1/swdb/', status: 400},
      {type: 'GET', data: {status: 'DEVEL'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', data: {statusDate: '1970-01-01'}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {statusDate: '1970-01-01'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', data: {version: 'NEW test version'}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {version: 'NEW test version'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', data: {branch: 'NEW Branch'}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {branch: 'NEW Branch'}, url: '/api/v1/swdb/',  status: 200},
      {type: 'PUT', url: '/api/v1/swdb/', status: 400, data: {branch: 'NEW Branch name that is much too long  much too long  much too long  much too long much too long much too long'}},
      {type: 'GET', data: {branch: 'NEW Branch'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {platforms: 'NEW test platform'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {platforms: 'NEW test platform'}},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {designDescDocLoc: 'http://www.somehost/some-path/some-file'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {designDescDocLoc: 'http://www.somehost/some-path/some-file'}},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {descDocLoc: 'http://www.somehost/some-path/some-file'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {descDocLoc: 'http://www.somehost/some-path/some-file'}},

      {type: 'PUT', data: {vvProcLoc: ['http://www.somehost/some-path/some-file']}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {vvProcLoc: ['http://www.somehost/some-path/some-file']}, url: '/api/v1/swdb/', status: 200},
      {type: 'PUT', data: {vvProcLoc: 'http:some-malformed-url'}, url: '/api/v1/swdb/', status: 400},
      {type: 'GET', data: {vvProcLoc: ['http://www.somehost/some-path/some-file']}, url: '/api/v1/swdb/', status: 200},

      {type: 'PUT', data: {vvResultsLoc: ['http://www.somehost/some-path/some-file3']}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {vvResultsLoc: ['http://www.somehost/some-path/some-file3']}, url: '/api/v1/swdb/', status: 200},
      {type: 'PUT', data: {vvResultsLoc: 'http:some-malformed-url'}, url: '/api/v1/swdb/', status: 400},
      {type: 'GET', data: {vvResultsLoc: ['http://www.somehost/some-path/some-file3']}, url: '/api/v1/swdb/', status: 200},

      {type: 'PUT', data: {versionControl: 'GIT'}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {versionControl: 'GIT'}, url: '/api/v1/swdb/',  status: 200},
      {type: 'PUT', data: {versionControl: 'Erroneous RCS'}, url: '/api/v1/swdb/', status: 400},
      {type: 'GET', data: {versionControl: 'GIT'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {versionControlLoc: 'http://www.somehost/some-path/some-file'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {versionControlLoc: 'http://www.somehost/some-path/some-file'}},

      {type: 'PUT', data: {previous: 'badbeefbadbeefbadbeefbad'}, url: '/api/v1/swdb/', status: 200},
      {type: 'GET', data: {previous: 'badbeefbadbeefbadbeefbad'}, url: '/api/v1/swdb/',  status: 200},
      {type: 'PUT', data: {previous: 'bad reference is way to long for this'}, url: '/api/v1/swdb/', status: 400},
      {type: 'GET', data: {previous: 'badbeefbadbeefbadbeefbad'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', url: '/api/v1/swdb/', status: 200, data: {comment: 'NEW test comment'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {comment: 'NEW test comment'}},

      // test new record basic only required items
      {type: 'POST', url: '/api/v1/swdb/', status: 201,
        data: {swName: 'NEW-test-name-1', desc: '', branch: '', version: '', owner: 'test owner', engineer: '',
                status: 'RDY_TEST', statusDate: '1970-01-01', levelOfCare: 'MEDIUM', descDocLoc: '', designDescDocLoc: '',
                vvProcLoc: [], vvResultsLoc: [], platforms: '', versionControl: '', versionControlLoc: '', comment: ''},
        msg: ''},

      // test new swName is required, min, max
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {owner: 'test owner'},
        msg: '{"param":"swName","msg":"Software name is required."}'},

      // test nwe owner required, min, max
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {swName: 'NEW Test name'},
        msg: '{"param":"owner","msg":"Owner is required."}'},

      // test levelOfCare required, enumerated
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {swName: 'NEW Test name', owner: 'NEW OWNER'},
        msg: '{"param":"levelOfCare","msg":"Level of care is required."}'},
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {swName: 'NEW Test name', owner: 'NEW OWNER', levelOfCare: 'LOW'},
        msg: '{"param":"status","msg":"Status is required."}'},
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {swName: 'NEW Test name', owner: 'NEW OWNER', levelOfCare: 'LOW', status: 'DEVEL'},
        msg: '{"param":"statusDate","msg":"Status date is required."}'},

      // test new status enumerated
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {status: 'not-enumerated'},
        msg: '{"param":"status","msg":"Status must be one of DEVEL, RDY_TEST, RDY_INST, DEP","value":"not-enumerated"}'},
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {swName: 'testing', owner: 'test owner', levelOfCare: 'LOW', status: 'DEVEL', statusDate: 'non-date'},
        msg: '{"param":"statusDate","msg":"Status date must be a date.","value":"non-date"}'},

      // test new version min, max
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {version: '0123456789012345678901234567890012345678901234567890123456789001234567890123456789012345678901234567890'},
        msg: '"param":"version","msg":"Version must less than 100 characters."'},

      // test new platforms min, max
      {type: 'POST', url: '/api/v1/swdb/', status: 400,
        data: {platforms: '0123456789012345678901234567890012345678901234567890123456789001234567890123456789012345678901234567890'},
        msg: '"param":"platforms","msg":"Platforms must less than 100 characters."'},

      // test new versionControl min, max
      {type: 'POST',  url: '/api/v1/swdb/', status: 400,
        data: {versionControl: 'Erroneous RCS'},
        msg: '"param":"versionControl","msg":"Version control must be one of GIT, AC, FS, DEB, OTHER"'},

      // test update owner min, max
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {swName: 'NEW Test name', owner: 'N'},
        msg: '"param":"owner","msg":"Owner must be 2-80 characters."'},
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
       data: {swName: 'NEW Test name', owner: '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'},
       msg: '"param":"owner","msg":"Owner must be 2-80 characters."'},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {owner: 'New test owner 1002'}},

      // test update levelOfCare enumerated
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {levelOfCare: 'not-enumerated'},
        msg: '{"param":"levelOfCare","msg":"Level of care must be one of LOW, MEDIUM, HIGH","value":"not-enumerated"}'},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {levelOfCare: 'LOW'}},

      // test update status enumerated
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {status: 'not-enumerated'},
        msg: '{"param":"status","msg":"Status must be one of DEVEL, RDY_TEST, RDY_INST, DEP","value":"not-enumerated"}'},
      {type: 'GET', data: {status: 'DEVEL'}, url: '/api/v1/swdb/',  status: 200},

      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {statusDate: 'non-date'},
        msg: '{"param":"statusDate","msg":"Status date must be a date.","value":"non-date"}'},
      {type: 'GET', data: {statusDate: '1970-01-01'}, url: '/api/v1/swdb/',  status: 200},

      // test update version min, max
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {version: '0123456789012345678901234567890012345678901234567890123456789001234567890123456789012345678901234567890'},
        msg: '"param":"version","msg":"Version must less than 100 characters."'},
      {type: 'GET', data: {version: 'NEW test version'}, url: '/api/v1/swdb/',  status: 200},

      // test update platforms min, max
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {platforms: '0123456789012345678901234567890012345678901234567890123456789001234567890123456789012345678901234567890'},
        msg: '"param":"platforms","msg":"Platforms must less than 100 characters."'},
      {type: 'GET', url: '/api/v1/swdb/', status: 200, data: {platforms: 'NEW test platform'}},

      // test update versionControl min, max
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {versionControl: 'Erroneous RCS'},
        msg: '"param":"versionControl","msg":"Version control must be one of GIT, AC, FS, DEB, OTHER"'},
      {type: 'GET', data: {versionControl: 'GIT'}, url: '/api/v1/swdb/',  status: 200},

      // test update comment
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {comment: ['NE']},
        msg: '"param":"comment","msg":"Comment must be a string."'},
      {type: 'PUT', url: '/api/v1/swdb/', status: 200,
        data: {comment: 'NE'}},
      {type: 'PUT', url: '/api/v1/swdb/', status: 200,
        data: {comment: '0123456789012345678901234567890'}},

      // test update desc
      {type: 'PUT', url: '/api/v1/swdb/', status: 400,
        data: {desc: ['NE']},
        msg: '"param":"desc","msg":"Description must be a string."'},
      {type: 'PUT', url: '/api/v1/swdb/', status: 200,
        data: {desc: 'NE'}},
      {type: 'PUT', url: '/api/v1/swdb/', status: 200,
        data: {desc: '0123456789012345678901234567890'}},
      {type: 'GET', url: '/api/v1/swdb/', status: 200,
        data: {desc: '0123456789012345678901234567890'}},
    ];

    // go through the table and check the given parameters
    for (const value of table) {
      // handle PUT
      if (value.type === 'PUT') {
        it(`${value.type} ${value.url}:id (${value.status}): ${JSON.stringify(value.data)}`, (done) => {
          supertest
          .put(value.url + wrapper.origId)
          .send(assign(template, value.data))
          .set('Cookie', cookie)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              if (res.status >= 400) {
                debug('Response: %s', res.text);
              }
              if (value.status) {
                expect(res.status).to.equal(value.status);
              }
              if (value.msg) {
                assert.deepInclude(res.text, value.msg || {});
              }

              debug('Location: ' + res.header.location);
              done();
            }
          });
        });
      }
      // handle POST
      if (value.type === 'POST') {
        it(`${value.type} ${value.url} (${value.status}): ${JSON.stringify(value.data)}`, (done) => {
          supertest
          .post(value.url)
          .send(value.data)
          .set('Cookie', cookie)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              if (res.status >= 400) {
                debug('Response: %s', res.text);
              }
              if (value.status) {
                expect(res.status).to.equal(value.status);
              }
              if (value.msg) {
                assert.deepInclude(res.text, value.msg || {});
              }
              debug('Location: ' + res.header.location);
              done();
            }
          });
        });
      }
      // handle GET
      if (value.type === 'GET') {
        it(`${value.type} ${value.url}:id (${value.status}): ${JSON.stringify(value.data)}`, (done) => {
          supertest
          .get(value.url + wrapper.origId)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              if (res.status >= 400) {
                debug('Response: %s', res.text);
              }
              if (value.status) {
                expect(res.status).to.equal(value.status);
              }
              for (const prop of Object.keys(value.data)) {
                expect(res.body).to.have.property(prop);
                assert.deepEqual(res.body[prop], value.data[prop]);
              }
              assign(template, value.data);
              done();
            }
          });
        });
      }
    }
    it('Errors on update a nonexistent record via POST swName id:badbeef', (done) => {
      supertest
        .post('/api/v1/swdb/badbeef')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .send({swName: 'Test Record4'})
        .expect(404)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.text).to.match(/Not Found/);
            debug('Location: ' + res.header.location);
            done();
          }
      });
    });
    it('Errors on update a nonexistent record via PUT swName id:badbeef', (done) => {
      supertest
        .put('/api/v1/swdb/badbeef')
        .set('Cookie', cookie)
        .send({swName: 'Test Record4'})
        .expect(404)
        .expect('Not Found')
        .end((err, res) => {
          if (res.status >= 400) {
            debug('Response: %s', res.text);
          }
          if (err) {
            done(err);
          } else {
            debug('Location: ' + res.header.location);
            done();
          }
        });
    });
  });
});
