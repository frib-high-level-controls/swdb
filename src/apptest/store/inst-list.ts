import server = require('../../app/server');
import express = require('express');
import chai = require('chai');
import supertest = require('supertest');
import chaiAsPromised = require('chai-as-promised');
import mongodb = require('mongodb');
import  webdriver = require('selenium-webdriver');
import test = require('selenium-webdriver/testing');
import TestTools = require('./TestTools');
import fs = require('fs');
import dbg = require('debug');
const debug = dbg('swdb:inst-list-tests');

import CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();
chai.use(chaiAsPromised);
let expect = chai.expect;
let By = webdriver.By;
let until = webdriver.until;
let testTools = new TestTools.TestTools();
let Cookies: string;

let app: express.Application;

/**
 * inst-list.ts
 * Test suite for software installations list page
 */

let chromeDriver;

test.describe('Installations record tests', function() {
  before('Prep DB', async function () {
    app = await server.start();
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


  let allCookies = null;

  test.it('should show search page with login button', function() {
    this.timeout(8000);

    chromeDriver = new webdriver.Builder()
      .forBrowser('chrome')
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 8000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      'Log in'), 8000);
  });

  test.it('login as test user', function(done){
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
        debug('test login cookies: ' + Cookies);
        let parts = Cookies.split('=');
        debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
        chromeDriver.manage().addCookie({name: parts[0], value: parts[1]});
        done();
      }
    });
  });

  test.it('should show search page with username on logout button', function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
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
    return expect(Promise.resolve(field.getText())).to.eventually.equal('Status date (m/d/y)');
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
