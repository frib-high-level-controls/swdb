import server = require('../../app/server');
import chai = require('chai');
import Supertest = require('supertest');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
import TestTools = require('./TestTools');
import webdriver = require('selenium-webdriver');
import test = require('selenium-webdriver/testing');
import dbg = require('debug');
const debug = dbg('swdb:swdb-list-tests');

import CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();
let expect = chai.expect;
let testTools = new TestTools.TestTools();
let By = webdriver.By;
let until = webdriver.until;
let app;
let supertest: any;

test.describe('Installations record tests', function() {
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

  test.it('should show title', function() {
    chromeDriver.wait(until.titleIs('SWDB - List'), 5000);
  });

  test.it("should show 'Add software' button", function() {
    chromeDriver.wait(until.elementLocated(By.id('addBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('addBtn')),
      'Add software'), 5000);
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

  test.it('should show SW name columns names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[1]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Software name');
  });

  test.it('should show Status column names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[2]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Branch');
  });

  test.it('should show Version column names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[3]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Version');
  });

  test.it('should show Owner column names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[4]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Owner');
  });

  test.it('should show Engineer column names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[5]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Engineer');
  });

  test.it('should show Status column names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[6]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Status');
  });

  test.it('should show Status date column names in proper order', function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[7]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Status date (m/d/y)');
  });

  test.it('should show a known record', function(this: any) {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]')), 8000);
    let link = chromeDriver.findElement(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]'));
    return expect(Promise.resolve(link.getText())).to.eventually.equal('BEAST');
  });

  // find a software record
  test.it('should find a sw record', function(this: any) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/list');
    chromeDriver.wait(until.elementLocated(By.id('swNameSrch')), 8000)
      .sendKeys('beast');
    chromeDriver.wait(until.elementLocated(By.id('versionSrch')), 8000)
      .sendKeys('0.2');
    chromeDriver.wait(until.elementLocated(By.id('branchSrch')), 8000)
      .sendKeys('b4');
    chromeDriver.wait(until.elementLocated(By.linkText('BEAST')),
      8000);
    let link = chromeDriver.findElement(By.linkText('BEAST'));
    link.getAttribute('href').then(function(result: string){
      expect(result).to.equal(props.webUrl + '#/details/5947589458a6aa0face9a554');
    });
  });
});
