let app = require('../../app/server');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
import mongodb = require('mongodb');

import  webdriver = require('selenium-webdriver');
let By = webdriver.By;
let until = webdriver.until;
import test = require('selenium-webdriver/testing');

import TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

import fs = require('fs');
import dbg = require('debug');
const debug = dbg('swdb:inst-list-tests');

import CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();

let chromeDriver;

test.describe('Installations record tests', function() {
  before('Prep DB', async function () {
    debug('Prep DB');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async function () {
    debug('Clear DB');
    // clear the test collection.
    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
  });


  let allCookies = null;

  test.it('should show search page with login button', function() {
    this.timeout(8000);

    chromeDriver = new webdriver.Builder()
      .forBrowser('chrome')
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      'Log in'), 5000);
  });

  test.it('should login', function() {
    // get test authentication
    chromeDriver.get(props.webUrl + 'testlogin?username=testuser&password=testuserpasswd');
    chromeDriver.wait(until.elementLocated(By.id('Test auth success')), 5000);
  });

  test.it('should show search page with username on logout button', function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      'testuser'), 5000);
  });
  test.it('should show Host column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[1]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Host');
  });

  test.it('should show name column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[2]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Name');
  });

  test.it('should show Software column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[3]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Software');
  });

  test.it('should show Area column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[4]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Area');
  });

  test.it('should show DRR column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[5]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('DRR');
  });

  test.it('should show Status column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[6]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Status');
  });

  test.it('should show Status date column names in proper order', function() {
    let xpath = '//*[@id="instList"]/thead/tr[1]/th[7]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    let field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Status Date');
  });

  // find an installation record
  test.it('should find a record', function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('hostSrch')), 8000)
      .sendKeys('host2');
    chromeDriver.wait(until.elementLocated(By.linkText('host2')),
      8000);

  });
});
