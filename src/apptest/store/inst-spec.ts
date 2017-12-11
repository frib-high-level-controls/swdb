import app = require('../../app/server');
import express = require('express');
import chai = require('chai');
let expect = chai.expect;
import supertest = require('supertest');
import tools = require('../../app/lib/swdblib');
import Be = require('../../app/lib/Db');
import instBe = require('../../app/lib/instDb');
import expect2 = require('expect');
import fs = require('fs');
import TestTools = require('./TestTools');
import dbg = require('debug');
const debug = dbg('swdb:inst-spec-tests');

import CommonTools = require('../../app/lib/CommonTools');


import webdriver = require('selenium-webdriver');
let By = webdriver.By;
let until = webdriver.until;
import test = require('selenium-webdriver/testing');
import path = require('path');
import child_process = require('child_process');
import { Express } from 'express-serve-static-core';


/**
 * inst-spec.ts
 * Test suite for software installations api
 */

let be = new Be.Db();
let testTools = new TestTools.TestTools();
let exec = child_process.exec;
let Cookies: string;
let ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();

describe('Installation api tests', () => {
  let chromeDriver;
  before('Prep DB', async  () => {
    debug('Prep DB(TS)');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async () => {
    debug('Clear DB');
    // clear the test collection.
    await testTools.clearTestCollections(debug);
  });

  before('login as test user', (done) => {
    supertest(app)
    .get('/testlogin?username=testuser&password=testuserpasswd')
    .expect(200)
    .end((err: Error, res: supertest.Response & {headers: any}) => {
      if (err) {
        done(err);
      } else {
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
        done();
      }
    });
  });

  // web facing tests
  //
  it('Respond with welcome', (done) => {
    supertest(app)
      .get('/')
      .expect(200)
      .end((err: Error, res: supertest.Response & {res: any}) => {
        if (err) {
          done(err);
        } else {
          expect(res.res.text).to.match(/SWDB \(Prototype Interface\)/);
          done();
        }
      });
  });
  it('Returns all sw records', (done) => {
    supertest(app)
      .get('/api/v1/swdb/')
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
  it('Returns all installation records', (done) => {
    supertest(app)
      .get('/api/v1/inst/')
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
  it('Post a new installation record', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .send({host: 'Test host', name: 'Test name', area: 'Global', status: 'DEVEL', statusDate: 'date 1000',
        software: 'badbeefbadbeefbadbeefbad'})
      .expect(201)
      .end(done);
  });

  it('Post a new header installation record',  (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .send({ host: 'Header Test host', name: 'Header Test name', area: 'Global', status: 'DEVEL',
         statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbad' })
      .expect(201)
      .end(done);
  });

  describe('Check location headers',  () => {
    let wrapper = { origId: null };
    before('Get ID record id:Test Record', (done) => {
      supertest(app)
        .get('/api/v1/inst/')
        .expect(200)
        .end( (err, res: supertest.Response & {length: any}) => {
          if (err) {
            done(err);
          } else {
            res = JSON.parse(res.text);
            for (let i = 0, iLen = res.length; i < iLen; i++) {
              if (res[i].host === 'Header Test host') {
                wrapper.origId = res[i]._id;
              }
            }
            done();
          }
        });
    });

    it('Returns test record id:Header Test Record', (done) => {
      supertest(app)
        .get('/api/v1/inst/' + wrapper.origId)
        .expect(200)
        .end((err: Error, res: supertest.Response) => {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.property('_id');
            expect(res.body.host).to.equal('Header Test host');
            expect(res.body._id).to.match(/.{24}/);
            expect(res.body.__v).to.match(/\d+/);
            done();
          }
        });
    });

    it('Returns the correct location header PUT existing record', (done) => {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ owner: 'Header owner' })
        .expect(200)
        .end((err, result: supertest.Response & {headers: any}) => {
          if (err) {
            done(err);
          } else {
            let re = new RegExp('^.*/api/v1/inst/' + wrapper.origId + '$');
            if (result.headers.location.match(re)) {
              done();
            } else {
              done(new Error('Location header is not set' + JSON.stringify(result.headers.location)));
            }
          }
        });
    });

    it('Returns the correct location header PATCH existing record', (done) => {
      supertest(app)
        .patch('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ owner: 'Header owner2' })
        .expect(200)
        .end((err, result: supertest.Response & {headers: any}) => {
          if (err) {
            done(err);
          } else {
            let re = new RegExp('^.*/api/v1/inst/' + wrapper.origId + '$');
            if (result.headers.location.match(re)) {
              done();
            } else {
              done(new Error('Location header is not set' + JSON.stringify(result.headers.location)));
            }
          }
        });
    });
  });
  it('Errors posting a bad status installation', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .send({host: 'test host', name: 'Test name', area: 'Global', status: 'BADENUM',
         statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbad'})
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .expect(400)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          let regex = 'Status must be one of {\\\\"0\\\\":\\\\"DEVEL\\\\",\\\\"1\\\\":\\\\"MAINT\\\\",\
\\\\"2\\\\":\\\\"RDY_INSTALL\\\\",\\\\"3\\\\":\\\\"RDY_INT_TEST\\\\",\
\\\\"4\\\\":\\\\"RDY_BEAM\\\\",\\\\"5\\\\":\\\\"DEPRECATED\\\\",\\\\"DEVEL\\\\":0,\
\\\\"MAINT\\\\":1,\\\\"RDY_INSTALL\\\\":2,\\\\"RDY_INT_TEST\\\\":3,\
\\\\"RDY_BEAM\\\\":4,\\\\"DEPRECATED\\\\":5}","value":"BADENUM"}';
          expect(res.text).to.match(new RegExp(regex));
          done();
        }
      });
  });

  it('Errors posting a duplicate installation record', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .send({host: 'Test host', name: 'Test name', area: 'Global', status: 'DEVEL', statusDate: 'date 1000',
         software: 'badbeefbadbeefbadbeefbad'})
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .expect(500)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res.text).to.match(new RegExp('E11000 duplicate key error'));
          done();
        }
      });
  });

  it('Post a new record installation on a different host', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .send({host: 'Test host2', name: 'Test name', area: 'Global', status: 'DEVEL',
       statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbad'})
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .expect(201)
      .end(done);
  });

  it('Post a new record installation with different sw ref', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .send({host: 'Test host', name: 'Test name', area: 'Global', status: 'DEVEL',
       statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbaa'})
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .expect(201)
      .end(done);
  });

  describe('get id for installation Test host test sw ref', () => {
    let wrapper = {origId: null};
    before('Get ID record id:Test host test sw ref', (done) => {
      supertest(app)
        .get('/api/v1/inst/')
        .expect(200)
        .end((err, res: supertest.Response & {length: any}) => {
          if (err) {
            done(err);
          } else {
            res = JSON.parse(res.text);
            for (let i = 0, iLen = res.length; i < iLen; i++) {
              if (res[i].host === 'Test host' &&
                res[i].software === 'badbeefbadbeefbadbeefbad') {
                wrapper.origId = res[i]._id;
              }
            }
            done();
          }
        });
    });

    it('Returns test installation record id:Test host test sw ref', (done) => {
      supertest(app)
        .get('/api/v1/inst/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.property('_id');
            expect(res.body.host).to.equal('Test host');
            expect(res.body._id).to.match(/.{24}/);
            expect(res.body.__v).to.match(/\d+/);
            done();
          }
        });
    });

    it('Can update a record via PUT host id:Test host3', (done) => {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .send({host: 'Test host3'})
        .set('Cookie', Cookies)
        .expect(200)
        .end(done);
    });

    it('Returns test record 1d:Test host3', (done) => {
      supertest(app)
        .get('/api/v1/inst/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.property('_id');
            expect(res.body.host).to.equal('Test host3');
            done();
          }
        });
    });



    // This table lists test requests to make and the expected
    // responses.
    // {req:{msg:,url:,type:,err{status:}}
    //  res:{msg:,url:,type:,err{status:}}
    //  }
    let testUpdateParams = [
      {type: 'PUT', req: {msg: {host: 'Test host4'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {host: 'Test host4'}, url: '/api/v1/inst/',  err: {status: 200}}},
      {type: 'PUT', req: {msg: {name: 'Test name4'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {name: 'Test name4'}, url: '/api/v1/inst/',  err: {status: 200}}},
      {type: 'PUT', req: {msg: {software: 'badbeefbadbeefbadbeefbad'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {software: 'badbeefbadbeefbadbeefbad'}, url: '/api/v1/inst/',  err: {status: 200}}},
      {type: 'PUT', req: {msg: {area: 'FE'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {area: 'FE'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'PUT', req: {msg: {drrs: 'Test DRR'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {drrs: 'Test DRR'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'PUT', req: {msg: {status: 'RDY_BEAM'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {status: 'RDY_BEAM'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'PUT', req: {msg: {statusDate: '1997-01-01T08:00:00.000Z'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {statusDate: '1997-01-01T08:00:00.000Z'}, url: '/api/v1/inst/',  err: {status: 200}}},
      {type: 'PUT', req: {msg: {vvResultsLoc: 'http://www.google.com'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {vvResultsLoc: 'http://www.google.com'}, url: '/api/v1/inst/',  err: {status: 200}}},
    ];

    // go through the table and check the given parameters
    testUpdateParams.forEach((value: any, i) => {
      // handle PUT
      if (value.type === 'PUT') {
        it(value.req.err.status + ' ' + value.type + ' msg: ' +
          JSON.stringify(JSON.stringify(value.req.msg)), (done) => {
            supertest(app)
              .put(value.req.url + wrapper.origId)
              .send(value.req.msg)
              .set('Cookie', Cookies)
              .end((err, res) => {
                if (err) {
                  done(err);
                } else {
                  if (value.req.err.status) {
                    expect(res.status).to.equal(value.req.err.status);
                  }
                  if (value.req.err.msgHas) {
                    expect2(res.text).toMatch(value.req.err.msgHas);
                  }

                  done();
                }
              });
          });
      }
      if (value.type === 'POST') {
        it(value.req.err.status + ' ' + value.type + ' ' + JSON.stringify(JSON.stringify(value.req.msg)),
         (done) => {
          supertest(app)
            .post(value.req.url)
            .send(value.req.msg)
            .set('Cookie', Cookies)
            .end((err, res) => {
              if (err) {
                done(err);
              } else {
                if (value.req.err.status) {
                  expect(res.status).to.equal(value.req.err.status);
                }
                if (value.req.err.msgHas) {
                  expect2(res.text).toMatch(value.req.err.msgHas);
                }
                done();
              }
            });
        });
      }

      // handle GET
      if (value.type === 'GET') {
        it(value.res.err.status + ' ' + JSON.stringify(value.res.msg), (done) => {
          supertest(app)
            .get(value.res.url + wrapper.origId)
            .end((err, res) => {
              if (err) {
                done(err);
              } else {
                if (value.res.err.status) {
                  expect(res.status).to.equal(value.res.err.status);
                }
                // for (let prop in value.res.msg) {
                for (let prop of Object.keys(value.res.msg)) {
                  expect(res.body).to.have.property(prop);
                  // This is to allow sloppy matching on whole objects.
                  // See the npm "expect" module for more
                  expect2(res.body[prop]).toMatch(value.res.msg[prop]);
                }
                done();
              }
            });
        });
      }
    });

    it('Errors on update a nonexistent record via POST id id:badbeef', (done) => {
      supertest(app)
        .post('/api/v1/inst/badbeef')
        .set('Cookie', Cookies)
        .send({swName: 'Test Record5'})
        .expect(404)
        .end( (err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.text).to.match(/Cannot POST \/api\/v1\/inst\/badbeef/);
            done();
          }
        });
    });

    it('Errors on update a nonexistent record via PUT id:badbeef', (done) => {
      supertest(app)
        .put('/api/v1/inst/badbeef')
        .set('Cookie', Cookies)
        .send({swName: 'Test Record5'})
        .expect(500)
        .expect('Record not found')
        .end(done);
    });

    it('Errors on update a nonexistent record via PATCH id:badbeef', (done) => {
      supertest(app)
        .patch('/api/v1/inst/badbeef')
        .set('Cookie', Cookies)
        .send({swName: 'Test Record5'})
        .expect(500)
        .expect('Record not found')
        .end(done);
    });
  });
});
