import server = require('../../app/server');
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

let app: express.Application;

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
  before('Prep DB', async  function() {
    this.timeout(5000);
    app = await server.start();
    debug('Prep DB');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async () => {
    debug('Clear DB');
    // clear the test collection.
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  before('login as test user', function(done){
    this.timeout(8000);
    supertest(app)
    .get('/login')
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end(function(err, res){
      if (err) {
        done(err);
      } else {
        Cookies = res.header['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + JSON.stringify(Cookies));
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
      .send({host: 'Test host', name: 'Test name', area: ['Global'], status: 'Ready for install', statusDate: 'date 1000',
        software: '5947589458a6aa0face9a512'})
      .expect(201)
      .end(done);
  });

  it('Post a new header installation record',  (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .send({ host: 'Header Test host', name: 'Header Test name', area: ['Global'], status: 'Ready for install',
         statusDate: 'date 1000', software: '5947589458a6aa0face9a512' })
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

  describe('Check history calls', function () {
    let wrapper = { origId: null };
    before('Before test post and get id', function (done) {
      supertest(app)
        .post('/api/v1/inst/')
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({
          host: 'Hist Test host', name: 'Hist1 Test name', area: ['Global'], status: 'Ready for install',
          statusDate: 'date 1000', software: '5947589458a6aa0face9a512',
        })
        .expect(201)
        .end((err: Error, result: supertest.Response & {headers: any}) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.headers.location);
            const urlParts = result.headers.location.split('/');
            wrapper.origId = urlParts[urlParts.length - 1];
            done();
          }
        });
    });
    before('Before modify test record (history2)', function (done) {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ name: 'Hist2 Test name' })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history3)', function (done) {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ name: 'Hist3 Test name' })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history4)', function (done) {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ name: 'Hist4 Test name' })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history5)', function (done) {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ name: 'Hist5 Test name' })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history6)', function (done) {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ name: 'Hist6 Test name' })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history7)', function (done) {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({ name: 'Hist7 Test name' })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });

    it('The API default history entry is correct', function (done) {
      supertest(app)
        .get('/api/v1/inst/hist/' + wrapper.origId)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            debug('Err history (inst api test): ' + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug('got history (inst api test): ' + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(5);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter((x) => x.name === 'name');
            // check that history item has the expected value
            expect(arr[0].value).to.equal('Hist7 Test name');
            done();
          }
        });
    });
    it('The API history (limit 1, skip1) entry is correct', function (done) {
      supertest(app)
        .get('/api/v1/swdb/hist/' + wrapper.origId + '?limit=1&skip=1')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            debug('Err history (inst api test): ' + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug('got history (inst api test): ' + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(1);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter((x) => x.name === 'name');
            // check that history item has the expected value
            expect(arr[0].value).to.equal('Hist6 Test name');
            done();
          }
        });
    });
  });

  it('Errors posting a bad status installation', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .send({host: 'test host', name: 'Test name', area: ['Global'], status: 'BADENUM',
         statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbad'})
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .expect(400)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          let regex = 'Status must be one of {\\\\"0\\\\":\\\\"Ready for install\\\\",\\\\"1\\\\":\\\\"Ready for verification\\\\",\\\\"2\\\\":\\\\"Ready for beam\\\\",\\\\"3\\\\":\\\\"Retired\\\\",\\\\"Ready for install\\\\":0,\\\\"Ready for verification\\\\":1,\\\\"Ready for beam\\\\":2,\\\\"Retired\\\\":3}';
          // 'Status must be one of {\\\\"0\\\\":\\\\"RDY_INSTALL\\\\",\\\\"1\\\\":\\\\"RDY_VERIFY\\\\",\\\\"2\\\\":\\\\"RDY_BEAM\\\\",\\\\"3\\\\":\\\\"RETIRED\\\\"';
          expect(res.text).to.match(new RegExp(regex));
          done();
        }
      });
  });

  it('Errors posting a duplicate installation record', (done) => {
    supertest(app)
      .post('/api/v1/inst/')
      .send({host: 'Test host', name: 'Test name', area: ['Global'], status: 'Ready for install', statusDate: 'date 1000',
         software: '5947589458a6aa0face9a512'})
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
      .send({host: 'Test host2', name: 'Test name', area: ['Global'], status: 'Ready for install',
       statusDate: 'date 1000', software: '5947589458a6aa0face9a512'})
      .set('Accept', 'application/json')
      .set('Cookie', Cookies)
      .expect(201)
      .end(done);
  });

  // it('Post a new record installation with different sw ref', (done) => {
  //   supertest(app)
  //     .post('/api/v1/inst/')
  //     .send({host: 'Test host', name: 'Test name', area: ['Global'], status: 'Ready for install',
  //      statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbaa'})
  //     .set('Accept', 'application/json')
  //     .set('Cookie', Cookies)
  //     .expect(201)
  //     .end(done);
  // });

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
                res[i].software === '5947589458a6aa0face9a512') {
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
      {type: 'PUT', req: {msg: {software: '5947589458a6aa0face9a512'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {software: '5947589458a6aa0face9a512'}, url: '/api/v1/inst/',  err: {status: 200}}},
      {type: 'PUT', req: {msg: {area: ['FE']}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {area: ['FE']}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'PUT', req: {msg: {drrs: 'Test DRR'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {drrs: 'Test DRR'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'PUT', req: {msg: {status: 'Ready for beam'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {status: 'Ready for beam'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'PUT', req: {msg: {statusDate: '1997-01-01T08:00:00.000Z'}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {statusDate: '1997-01-01T08:00:00.000Z'}, url: '/api/v1/inst/',  err: {status: 200}}},
      {type: 'PUT', req: {msg: {vvResultsLoc: ['http://www.google.com']}, url: '/api/v1/inst/', err: {status: 200}}},
      {type: 'GET', res: {msg: {vvResultsLoc: ['http://www.google.com']}, url: '/api/v1/inst/',  err: {status: 200}}},
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
        .expect(400)
        .expect('Worklow validation errors: [{"error":true,"data":"Record id parse err: badbeef: {}"}]')
        .end(done);
    });

    it('Errors on update a nonexistent record via PATCH id:badbeef', (done) => {
      supertest(app)
        .patch('/api/v1/inst/badbeef')
        .set('Cookie', Cookies)
        .send({swName: 'Test Record5'})
        .expect(400)
        .expect('Worklow validation errors: [{"error":true,"data":"Record id parse err: badbeef: {}"}]')
        .end(done);
    });
  });

  describe('Workflow rule 2 testing', () => {
    /*
     * Tests for installations can have software change only if installation is Ready to install
     * 1) Make a new installation record pointing to existing sw in status Ready for install
     * 2) Create a new software record in state Ready for instal
     * 3) Try to set installation to the new software record in state Ready for install
     * 4) Set the installation status to Ready for beam
     * 5) Try to set installation back to the original software
     *  (this should fail with the proper error listed)
     */
    let wrapper = { origId: null, swId: null };
    it('Post a new installation record', (done) => {
      supertest(app)
        .post('/api/v1/inst/')
        .send({
          host: 'Rule 2 test host', name: 'Test name', area: ['Global'], status: 'Ready for install',
          statusDate: 'date 1000', software: '5947589458a6aa0face9a512',
        })
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .expect(201)
        // .end(done);
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            let id = res.header.location.split(/\//).pop();
            wrapper.origId = id;
            done()
          }
        });
    });

    it('Post a new software record', (done) => {
      supertest(app)
        .post('/api/v1/swdb/')
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({
          swName: 'Rule 2 Test Record',
          version: 'test version',
          branch: 'test branch',
          owner: 'previous Test Owner',
          engineer: 'Test Engineer',
          levelOfCare: 'LOW',
          status: 'Ready for install',
          statusDate: '0',
        })
        .expect(201)
        // .end(done);
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            let id = res.header.location.split(/\//).pop();
            wrapper.swId = id;
            done();
          }
        })
    });

    it('set software field to something in Ready for install', (done) => {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .send({ software: wrapper.swId })
        .set('Cookie', Cookies)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            debug('in err wrapper.origId = ' + wrapper.origId);
            debug('in err wrapper.swId = ' + wrapper.swId);
            debug(JSON.stringify(res));
            done(err);
          } else {
            done();
          }
        })
    });

    it('Set status to Read for beam', (done) => {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Cookie', Cookies)
        .send({status: 'Ready for beam'})
        .expect(200)
        .end(done);
    });

    it('Set software to something else', (done) => {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Cookie', Cookies)
        .send({ software: '5947589458a6aa0face9a512' })
        .expect(400)
        .expect('Worklow validation errors: [{\"error\":true,\"data\":\"Installation software field can only be changed in state Ready for install\"}]')
        .end(function (err, res) {
          if (err) {
            debug(JSON.stringify(res));
            done(err);
          } else {
            done();
          }
        })
    });
  });

  describe('Workflow rule 3 testing', () => {
    /*
     * Tests for installations being set software records in status Ready for install
     * 1) Make a new installation record pointing to existing sw in status Ready for install
     * 2) Create a new software record in state Development
     * 3) Try to set installation to the new software record in state Development
     *  (this should fail with the proper error listed)
     */
    let wrapper = { origId: null, swId: null };
    it('Post a new installation record', (done) => {
      supertest(app)
        .post('/api/v1/inst/')
        .send({
          host: 'Rule 3 test host', name: 'Test name', area: ['Global'], status: 'Ready for install',
          statusDate: 'date 1000', software: '5947589458a6aa0face9a512',
        })
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .expect(201)
        // .end(done);
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            let id = res.header.location.split(/\//).pop();
            wrapper.origId = id;
            done()
          }
        });
    });

    it('Post a new software record', (done) => {
      supertest(app)
        .post('/api/v1/swdb/')
        .set('Accept', 'application/json')
        .set('Cookie', Cookies)
        .send({
          swName: 'Rule 3 Test Record',
          version: 'test version',
          branch: 'test branch',
          owner: 'previous Test Owner',
          engineer: 'Test Engineer',
          levelOfCare: 'LOW',
          status: 'Development',
          statusDate: '0',
        })
        .expect(201)
        // .end(done);
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            let id = res.header.location.split(/\//).pop();
            wrapper.swId = id;
            done();
          }
        });
    });

    it('Rule 3 Fails setting software to something status Development', (done) => {
      supertest(app)
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Cookie', Cookies)
        .send({ software: wrapper.swId })
        .expect(400)
        .expect('Worklow validation errors: [{"error":true,"data":"Software field must point to software ' +
         'with status Ready for install.The given software, ' +
         wrapper.swId + ', has status Development"}]')
        .end(function (err, res) {
          if (err) {
            debug(JSON.stringify(res));
            done(err);
          } else {
            done();
          }
        })
    });
  });
});
