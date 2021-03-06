/**
 * Test for Software Installation API specification.
 */

/* tslint:disable:max-line-length */

import { assert, expect } from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import { assign } from 'lodash';

import * as SuperTest from 'supertest';

import * as server from './app';

import * as data from './data';
import * as cookies from './lib/cookies';

const debug = Debug('swdb:routes:api-swinstalls-test');

const props = data.PROPS;


describe('Software Installation API Specification', () => {
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
        if (err) {
          done(err);
        } else {
          expect(res.text).to.match(/SCDB/);
          done();
        }
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

  it('Returns all installation records', (done) => {
    supertest
      .get('/api/v1/inst')
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
    supertest
      .post('/api/v1/inst')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        host: 'Test host',
        name: 'Test name',
        area: ['Global'],
        status: 'RDY_INST',
        statusDate: '2017-04-21',
        vvResultsLoc: [],
        vvApprovalDate: '2017-04-21',
        software: '5947589458a6aa0face9a512',
        drr: '',
      })
      .expect(201)
      .end(done);
  });

  it('Post a new header installation record',  (done) => {
    supertest
      .post('/api/v1/inst')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .send({
        host: 'Header Test host',
        name: 'Header Test name',
        area: ['Global'],
        status: 'RDY_INST',
        statusDate: '2017-04-21',
        software: '5947589458a6aa0face9a512',
        vvResultsLoc: [],
        vvApprovalDate: '',
        drr: '',
      })
      .expect(201)
      .end(done);
  });

  describe('Check location headers',  () => {
    const wrapper = { origId: null };
    before('Get ID record id:Test Record', (done) => {
      supertest
        .get('/api/v1/inst')
        .expect(200)
        .end( (err, res: any) => {
          if (err) {
            done(err);
          } else {
            res = JSON.parse(res.text);
            for (let i = 0, iLen = res.length; i < iLen; i++) {
              if (res[i].host === 'Header Test host') {
                wrapper.origId = res[i].id;
              }
            }
            done();
          }
        });
    });

    it('Returns test record id:Header Test Record', (done) => {
      supertest
        .get('/api/v1/inst/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            debug('res.body' + JSON.stringify(res.body));
            expect(res.body).to.have.property('id');
            expect(res.body.host).to.equal('Header Test host');
            expect(res.body.id).to.match(/.{24}/);
            done();
          }
        });
    });

    it('Returns the correct location header PUT existing record', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          host: 'Header Test host',
          name: 'Header Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            const re = new RegExp('^.*/api/v1/inst/' + wrapper.origId + '$');
            if (result.header.location.match(re)) {
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
        .post('/api/v1/inst')
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          host: 'Hist Test host',
          name: 'Hist1 Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(201)
        .end((err: Error, result) => {
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
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Hist2 Test name',
          host: 'Hist Test host',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history3)', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Hist3 Test name',
          host: 'Hist Test host',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history4)', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Hist4 Test name',
          host: 'Hist Test host',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history5)', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Hist5 Test name',
          host: 'Hist Test host',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history6)', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Hist6 Test name',
          host: 'Hist Test host',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
    before('Before modify test record (history7)', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Hist7 Test name',
          host: 'Hist Test host',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(200)
        .end((err: Error, result) => {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });

    it('The API default history entry is correct', (done) => {
      supertest
        .get('/api/v1/inst/hist/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            debug('Err history (inst api test): ' + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug('got history (inst api test): ' + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(5);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter((x: any) => x.name === 'name');
            // check that history item has the expected value
            expect(arr[0].value).to.equal('Hist7 Test name');
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
            debug('Err history (inst api test): ' + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug('got history (inst api test): ' + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(1);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter((x: any) => x.name === 'name');
            // check that history item has the expected value
            expect(arr[0].value).to.equal('Hist6 Test name');
            done();
          }
        });
    });
  });

  it('Errors posting a bad status installation', (done) => {
    supertest
      .post('/api/v1/inst')
      .send({
        host: 'test host',
        name: 'Test name',
        area: ['Global'],
        status: 'BADENUM',
        statusDate: '2017-04-21',
        software: 'badbeefbadbeefbadbeefbad',
        vvResultsLoc: [],
        vvApprovalDate: '',
        drr: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(400)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          const regex = 'Status must be one of RDY_INST, RDY_VER, RDY_BEAM, RET';
          expect(res.text).to.match(new RegExp(regex));
          done();
        }
      });
  });

  it('Errors posting a duplicate installation record', (done) => {
    supertest
      .post('/api/v1/inst')
      .send({
        host: 'Test host',
        name: 'Test name',
        area: ['Global'],
        status: 'RDY_INST',
        statusDate: '2017-04-21',
        software: '5947589458a6aa0face9a512',
        vvResultsLoc: [],
        vvApprovalDate: '',
        drr: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
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
    supertest
      .post('/api/v1/inst')
      .send({
        host: 'Test host2',
        name: 'Test name',
        area: ['Global'],
        status: 'RDY_INST',
        statusDate: '2017-04-21',
        software: '5947589458a6aa0face9a512',
        vvResultsLoc: [],
        vvApprovalDate: '',
        drr: '',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(201)
      .end(done);
  });

  // it('Post a new record installation with different sw ref', (done) => {
  //   supertest
  //     .post('/api/v1/inst')
  //     .send({host: 'Test host', name: 'Test name', area: ['Global'], status: 'Ready for install',
  //      statusDate: 'date 1000', software: 'badbeefbadbeefbadbeefbaa'})
  //     .set('Accept', 'application/json')
  //     .set('Cookie', cookie)
  //     .expect(201)
  //     .end(done);
  // });

  describe('get id for installation Test host test sw ref', () => {
    const wrapper = {origId: null};
    before('Get ID record id:Test host test sw ref', (done) => {
      supertest
        .get('/api/v1/inst')
        .expect(200)
        .end((err, res: any) => {
          if (err) {
            done(err);
          } else {
            res = JSON.parse(res.text);
            for (let i = 0, iLen = res.length; i < iLen; i++) {
              if (res[i].host === 'Test host' &&
                res[i].software === '5947589458a6aa0face9a512') {
                wrapper.origId = res[i].id;
              }
            }
            done();
          }
        });
    });

    it('Returns test installation record id:Test host test sw ref', (done) => {
      supertest
        .get('/api/v1/inst/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.property('id');
            expect(res.body.host).to.equal('Test host');
            expect(res.body.id).to.match(/.{24}/);
            done();
          }
        });
    });

    it('Can update a record via PUT host id:Test host3', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .send({
          host: 'Test host3',
          name: 'Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .set('Cookie', cookie)
        .expect(200)
        .end(done);
    });

    it('Returns test record 1d:Test host3', (done) => {
      supertest
        .get('/api/v1/inst/' + wrapper.origId)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.property('id');
            expect(res.body.host).to.equal('Test host3');
            done();
          }
        });
    });


    const template = {
      host: 'Test host3',
      name: 'Test name',
      area: ['Global'],
      status: 'RDY_INST',
      statusDate: '2017-04-21',
      software: '5947589458a6aa0face9a512',
      vvResultsLoc: [],
      vvApprovalDate: '',
      drr: '',
    };

    // This table lists test requests to make and the expected
    // responses.
    // {req:{msg:,url:,type:,err{status:}}
    //  res:{msg:,url:,type:,err{status:}}
    //  }
    const testUpdateParams: Array<{type: string; url: string; status: number, data: any, msg?: string}> = [
      {type: 'PUT', url: '/api/v1/inst/', status: 200, data: {host: 'Test host4'}},
      {type: 'GET', url: '/api/v1/inst/', status: 200, data: {host: 'Test host4'}},
      {type: 'PUT', url: '/api/v1/inst/', status: 200, data: {name: 'Test name4'}},
      {type: 'GET', url: '/api/v1/inst/', status: 200, data: {name: 'Test name4'}},
      {type: 'PUT', data: {software: '5947589458a6aa0face9a512'}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {software: '5947589458a6aa0face9a512'}, url: '/api/v1/inst/',  status: 200},
      {type: 'PUT', data: {area: ['FE']}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {area: ['FE']}, url: '/api/v1/inst/', status: 200},
      {type: 'PUT', data: {drr: 'Test DRR'}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {drr: 'Test DRR'}, url: '/api/v1/inst/', status: 200},
      {type: 'PUT', data: {status: 'RDY_BEAM'}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {status: 'RDY_BEAM'}, url: '/api/v1/inst/', status: 200},
      {type: 'PUT', data: {statusDate: '1997'}, url: '/api/v1/inst/', status: 400},
      {type: 'PUT', data: {statusDate: '1997-01-01'}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {statusDate: '1997-01-01'}, url: '/api/v1/inst/',  status: 200},
      {type: 'PUT', data: {vvApprovalDate: '1997-01-01T08:00:00.000Z'}, url: '/api/v1/inst/', status: 400},
      {type: 'PUT', data: {vvApprovalDate: '1997-01-01'}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {vvApprovalDate: '1997-01-01'}, url: '/api/v1/inst/',  status: 200},
      {type: 'PUT', data: {vvResultsLoc: ['http://www.google.com']}, url: '/api/v1/inst/', status: 200},
      {type: 'GET', data: {vvResultsLoc: ['http://www.google.com']}, url: '/api/v1/inst/',  status: 200},
    ];

    // go through the table and check the given parameters
    for (const value of testUpdateParams) {
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
                  if (value.status) {
                    expect(res.status).to.equal(value.status);
                  }
                  if (value.msg) {
                    expect(res.text).to.equal(value.msg);
                  }

                  done();
                }
              });
          });
      }
      // handle POST (Not currently used!)
      // if (value.type === 'POST') {
      //   it(value.req.err.status + ' ' + value.type + ' ' + JSON.stringify(JSON.stringify(value.req.msg)),
      //    (done) => {
      //     supertest
      //       .post(value.req.url)
      //       .send(value.req.msg)
      //       .set('Cookie', cookie)
      //       .end((err, res) => {
      //         if (err) {
      //           done(err);
      //         } else {
      //           if (value.req.err.status) {
      //             expect(res.status).to.equal(value.req.err.status);
      //           }
      //           if (value.req.err.msgHas) {
      //             expect(res.text).to.equal(value.req.err.msgHas);
      //           }
      //           done();
      //         }
      //       });
      //   });
      // }

      // handle GET
      if (value.type === 'GET') {
        it(`${value.type} ${value.url}:id (${value.status}): ${JSON.stringify(value.data)}`, (done) => {
          supertest
            .get(value.url + wrapper.origId)
            .end((err, res) => {
              if (err) {
                done(err);
              } else {
                if (value.status) {
                  expect(res.status).to.equal(value.status);
                }
                for (const prop of Object.keys(value.data)) {
                  expect(res.body).to.have.property(prop);
                  assert.deepEqual(res.body[prop], value.data[prop]);
                }
                done();
              }
            });
        });
      }
    }

    it('Errors on update a nonexistent record via POST id id:badbeef', (done) => {
      supertest
        .post('/api/v1/inst/badbeef')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .send({swName: 'Test Record5'})
        .expect(404)
        .end( (err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res.text).to.match(/Not Found/);
            done();
          }
        });
    });

    it('Errors on update a nonexistent record via PUT id:badbeef', (done) => {
      supertest
        .put('/api/v1/inst/badbeef')
        .set('Cookie', cookie)
        .send({swName: 'Test Record5'})
        .expect(404)
        .expect('Not Found')
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
    const wrapper = { origId: null, swId: null };
    it('Post a new installation record', (done) => {
      supertest
        .post('/api/v1/inst')
        .send({
          host: 'Rule 2 test host',
          name: 'Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(201)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            const id = res.header.location.split(/\//).pop();
            wrapper.origId = id;
            done();
          }
        });
    });

    it('Post a new software record', (done) => {
      supertest
        .post('/api/v1/swdb')
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Rule 2 Test Record',
          desc: '',
          version: 'test version',
          branch: 'test branch',
          owner: 'previous Test Owner',
          engineer: 'Test Engineer',
          levelOfCare: 'LOW',
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          platforms: '',
          descDocLoc: '',
          designDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          comment: '',
        })
        .expect(201)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            const id = res.header.location.split(/\//).pop();
            wrapper.swId = id;
            done();
          }
        });
    });

    it('set software field to something in Ready for install', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .send({
          host: 'Rule 2 test host',
          name: 'Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
          software: wrapper.swId,
        })
        .set('Cookie', cookie)
        .expect(200)
        .end((err, res) => {
          if (err) {
            debug('in err wrapper.origId = ' + wrapper.origId);
            debug('in err wrapper.swId = ' + wrapper.swId);
            debug(JSON.stringify(res));
            done(err);
          } else {
            done();
          }
        });
    });

    it('Set status to Ready for beam', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Cookie', cookie)
        .send({
          host: 'Rule 2 test host',
          name: 'Test name',
          area: ['Global'],
          statusDate: '2017-04-21',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
          software: wrapper.swId,
          status: 'RDY_BEAM',
        })
        .expect(200)
        .end(done);
    });

    it('Set software to something else', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Cookie', cookie)
        .send({
          host: 'Rule 2 test host',
          name: 'Test name',
          area: ['Global'],
          statusDate: '2017-04-21',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
          status: 'RDY_BEAM',
          software: '5947589458a6aa0face9a512',
        })
        .expect(400)
        .expect('Worklow validation errors: "Installation software field can only be changed in state RDY_INST"')
        .end((err, res) => {
          if (err) {
            debug(JSON.stringify(res));
            done(err);
          } else {
            done();
          }
        });
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
    const wrapper = { origId: null, swId: null };
    it('Post a new installation record', (done) => {
      supertest
        .post('/api/v1/inst')
        .send({
          host: 'Rule 3 test host',
          name: 'Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          software: '5947589458a6aa0face9a512',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(201)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            const id = res.header.location.split(/\//).pop();
            wrapper.origId = id;
            done();
          }
        });
    });

    it('Post a new software record', (done) => {
      supertest
        .post('/api/v1/swdb')
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({
          name: 'Rule 3 Test Record',
          desc: '',
          version: 'test version',
          branch: 'test branch',
          owner: 'previous Test Owner',
          engineer: 'Test Engineer',
          levelOfCare: 'LOW',
          status: 'DEVEL',
          statusDate: '2017-04-21',
          platforms: '',
          descDocLoc: '',
          designDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          versionControl: '',
          versionControlLoc: '',
          comment: '',
        })
        .expect(201)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            // grab the new installation id from the returned location header.
            // We use this later to verify the error message.
            const id = res.header.location.split(/\//).pop();
            wrapper.swId = id;
            done();
          }
        });
    });

    it('Rule 3 Fails setting software to something status Development', (done) => {
      supertest
        .put('/api/v1/inst/' + wrapper.origId)
        .set('Cookie', cookie)
        .send({
          software: wrapper.swId,
          host: 'Rule 3 test host',
          name: 'Test name',
          area: ['Global'],
          status: 'RDY_INST',
          statusDate: '2017-04-21',
          vvResultsLoc: [],
          vvApprovalDate: '',
          drr: '',
        })
        .expect(400)
        .expect('Worklow validation errors: "Software field must point to software ' +
         'with status RDY_INST.The given software, ' +
         wrapper.swId + ', has status DEVEL"')
        .end((err, res) => {
          if (err) {
            debug(JSON.stringify(res));
            done(err);
          } else {
            done();
          }
        });
    });
  });
});
