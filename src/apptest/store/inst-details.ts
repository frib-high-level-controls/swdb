export = {};
import server = require('../../app/server');
let app;
import chai = require('chai');
let expect = chai.expect;
import Supertest = require('supertest');
import chaiaspromised = require('chai-as-promised');
chai.use(chaiaspromised);

import TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

import webdriver = require('selenium-webdriver');
let By = webdriver.By;
let until = webdriver.until;
import test = require('selenium-webdriver/testing');
import dbg = require('debug');
const debug = dbg('swdb:inst-details-tests');

import CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props: any = {};
let supertest: any;
props = ctools.getConfiguration();


test.describe('Installations detail screen tests', function() {
  let chromeDriver: any = null;
  before('Prep DB', async function () {
    app = await server.start();
    supertest = Supertest(app);
    debug('Prep DB');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async function () {
    debug('Clear DB');
    // clear the test collection.
    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  test.it('should show search page with login button', function(this: any) {
    chromeDriver = new webdriver.Builder()
      .forBrowser('chrome')
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      'Log in'), 5000);
  });

  test.it('login as test user', function(this: any, done: MochaDone){
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
        let Cookies = res.headers['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + Cookies);
        let parts = Cookies.split('=');
        debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
        chromeDriver.manage().addCookie({name: parts[0], value: parts[1]});
        done();
      }
    });
  });

  test.it('should show search page with username on logout button', function(this: any) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it('should find a record', function(this: any) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('hostSrch')), 8000)
      .sendKeys('host2');
    chromeDriver.wait(until.elementLocated(By.linkText('host2')),
      8000);
  });

  test.it('should show the requested installation record title', function() {
    chromeDriver.findElement(By.linkText('host2')).click();
    chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
  });

  test.it('should show the requested installation record user button', function() {
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it('should show the requested installation record host field', function() {
    chromeDriver.wait(until.elementLocated(By.id('host')), 5000);
    chromeDriver.findElement(By.id('host')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/host2/);
    });
  });

  test.it('should show the requested installation record name field', function() {
    chromeDriver.wait(until.elementLocated(By.id('name')), 5000);
    chromeDriver.findElement(By.id('name')).getAttribute('value').then(function(result: String) {
      expect(result).to.equal('Installation name2');
    });
  });

  test.it('should show the requested installation record software field', function() {
    chromeDriver.wait(until.elementLocated(By.id('software')), 5000);
    chromeDriver.findElement(By.id('software')).getAttribute('value').then(function(result: String) {
      expect(result).to.equal('BEAST / b4 / 0.2');
    });
  });

  test.it('should show the requested installation record area field', function() {
    chromeDriver.wait(until.elementLocated(By.id('area')), 5000);
    chromeDriver.findElement(By.id('area')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/LS1/);
    });
  });

  test.it('should show the requested installation record status field', function() {
    chromeDriver.wait(until.elementLocated(By.id('status')), 5000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/Ready for install/);
    });
  });

  test.it('should show the requested installation record status date field', function() {
    chromeDriver.wait(until.elementLocated(By.id('statusDate')), 5000);
    chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/9\/21\/2016/);
    });
  });

  test.it('should show the requested installation record vvResults field', function() {
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 5000);
    chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/vvResultsLoc2/);
    });
  });

  test.it('should show the requested installation record VV approval date field', function() {
    chromeDriver.wait(until.elementLocated(By.id('vvApprovalDate')), 5000);
    chromeDriver.findElement(By.id('vvApprovalDate')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/9\/22\/2016/);
    });
  });

  test.it('should show the requested installation record drrs field', function() {
    chromeDriver.wait(until.elementLocated(By.id('drrs')), 5000);
    chromeDriver.findElement(By.id('drrs')).getAttribute('value').then(function(result: String) {
      expect(result).to.match(/^$/);
    });
  });
});
