import server = require('../../app/server');
import chai = require('chai');
import Supertest = require('supertest');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
import TestTools = require('./TestTools');
import webdriver = require('selenium-webdriver');
import test = require('selenium-webdriver/testing');
import dbg = require('debug');
const debug = dbg('swdb:swdb-details-tests');

import CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();
let testTools = new TestTools.TestTools();
let By = webdriver.By;
let  until = webdriver.until;
let expect = chai.expect;
let app;
let supertest: any;

test.describe('Preload db record tests', function() {
  let chromeDriver: any;

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
    this.timeout(8000);

    chromeDriver = new webdriver.Builder()
      .forBrowser('chrome')
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    chromeDriver.get(props.webUrl + '#/list');
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
    chromeDriver.get(props.webUrl + '#/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it("should show 'Add software' button", function() {
    chromeDriver.wait(until.elementLocated(By.id('addBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('addBtn')),
      'Add software'), 5000);
  });

  test.it('should show a known record', function(this: any) {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]')), 8000);
    let link = chromeDriver.findElement(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]'));
    expect(Promise.resolve(link.getText())).to.eventually.equal('BEAST');
    link.click();
  });

  test.it('should show details record title', function() {
    chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
  });

  test.it("should show 'Back' button", function() {
    chromeDriver.wait(until.elementLocated(By.id('cancelBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('cancelBtn')),
      'Back to search'), 5000);
  });

  test.it("should show 'Update' button", function() {
    chromeDriver.wait(until.elementLocated(By.id('updateBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('updateBtn')),
      'Update this document'), 5000);
  });

  test.it("should show 'Software' tab", function() {
    chromeDriver.wait(until.elementLocated(By.id('swTab')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('swTab')),
      'Software'), 5000);
  });

  test.it("should show 'Installations' tab", function() {
    chromeDriver.wait(until.elementLocated(By.id('instTab')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('instTab')),
      'Installations'), 5000);
  });

  test.it('should show the correct software name in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('BEAST');
      });
  });

  test.it('should show the correct software branch in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    chromeDriver.findElement(By.id('branch')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('b4');
      });
  });

  test.it('should show the correct software version in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    chromeDriver.findElement(By.id('version')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('0.2');
      });
  });

  test.it('should show the correct description in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
    chromeDriver.findElement(By.id('desc')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct description doc in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
    chromeDriver.findElement(By.id('descDocLoc')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct design description doc in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
    chromeDriver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct owner in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
    chromeDriver.findElement(By.id('owner')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('Berryman');
      });
  });

  test.it('should show the correct engineer in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
    chromeDriver.findElement(By.id('engineer')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct levelOfCare in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
    chromeDriver.findElement(By.id('levelOfCare')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('Medium');
      });
  });

  test.it('should show the correct status in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('Development');
      });
  });

  test.it('should show the correct statusDate in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
    chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('7/7/1970');
      });
  });

  test.it('should show the correct platforms in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
    chromeDriver.findElement(By.id('platforms')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct vvProcLoc in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('vvProcLoc')), 3000);
    chromeDriver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct vvResultsLoc in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
    chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct versionControl in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
    chromeDriver.findElement(By.id('versionControl')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct versionControlLoc in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
    chromeDriver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
      function (text: string) {
        expect(text).to.equal('');
      });
  });
});
