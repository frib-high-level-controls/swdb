import server = require('../../app/server');
import express = require('express');
import chai = require('chai');
import Supertest = require('supertest');
import chaiAsPromised = require('chai-as-promised');
import rc = require('rc');
import TestTools = require('./TestTools');
import webdriver = require('selenium-webdriver');
import test = require('selenium-webdriver/testing');
import fs = require('fs');
import path = require('path');
import dbg = require('debug');
import CommonTools = require('../../app/lib/CommonTools');

chai.use(chaiAsPromised);
let testTools = new TestTools.TestTools();
let supertest;
let expect = chai.expect;
let By = webdriver.By;
let until = webdriver.until;
const debug = dbg('swdb:inst-new-tests');

let ctools = new CommonTools.CommonTools();
let props: any  = {};
let Cookies: String;
props = ctools.getConfiguration();
let app: express.Application;


test.describe('Installations add screen tests', function() {
  let chromeDriver;
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

  test.it('login as test user', function(done) {
    this.timeout(8000);
    supertest
    .get('/login')
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end(function(err, res){
      if (err) {
        done(err);
      } else {
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
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

  test.it('should show new page with username on logout button', function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/new');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });


  test.it('should show the requested installation record title', function() {
    chromeDriver.wait(until.titleIs('SWDB - New Installation'), 5000);
  });

  test.it('Add new record - set host', function() {
    this.timeout(15000);
    chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
    let input = chromeDriver.findElement(By.id('host'));
    input.sendKeys('testHost1');
  });

  test.it('Add new record - set software', function() {
    this.timeout(15000);
    // set software
    chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
    let searchInput = chromeDriver.findElement(By.id('software'));
    searchInput.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
    searchInput = chromeDriver.findElement(By.xpath('//*[@id="software"]/input[1]'));
    searchInput.sendKeys('BEAST');
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-0"]/span')));
    let input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-0"]/span'));
    input.click();
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('software')),
       'BEAST/b12/0.2'), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('software')),
       'BEAST/b12/0.2'), 3000);
  });

  test.it('Add new record - set name', function() {
    // set name
    chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
    let input = chromeDriver.findElement(By.id('name'));
    input.click();
    input.sendKeys('Test name');
  });

  test.it('Add new record - set area 0', function() {
    this.timeout(6000);
    // set area
    // add controls room, operator area, nscl control room
    // then delete the controls room
    chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
    let input = chromeDriver.findElement(By.id('add.area'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('area.0')), 3000);
    let input0 = chromeDriver.findElement(By.id('area.0'));
    input0.click();

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.0"]/input[1]')), 3000);
    let input0b = chromeDriver.findElement(By.xpath('//*[@id="area.0"]/input[1]'));
    input0b.sendKeys('controls\n');

    chromeDriver.wait(until.elementTextContains(input0,
      'IFS:LAB.FRIB.ASD.CONTROLS.HLCO'), 5000);
    });

  test.it('Add new record - set area 1', function() {
    this.timeout(6000);
    chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
    let input = chromeDriver.findElement(By.id('add.area'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('area.1')), 3000);
    let input1 = chromeDriver.findElement(By.id('area.1'));
    input1.click();

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/input[1]')), 3000);
    let input1b = chromeDriver.findElement(By.xpath('//*[@id="area.1"]/input[1]'));
    input1b.sendKeys('operator\n');

    chromeDriver.wait(until.elementTextContains(input1,
      'IFS:LAB.FRIB.ASD.ACCELERATOROPS.MACHINEOPERATORS'), 5000);
    });

  test.it('Add new record - set area 2', function() {
    this.timeout(6000);
    chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
    let input = chromeDriver.findElement(By.id('add.area'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('area.2')), 3000);
    let input2 = chromeDriver.findElement(By.id('area.2'));
    input2.click();

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.2"]/input[1]')), 3000);
    let input2b = chromeDriver.findElement(By.xpath('//*[@id="area.2"]/input[1]'));
    input2b.sendKeys('control room\n');

    chromeDriver.wait(until.elementTextContains(input2,
      'ADB:AREA.NSCL.CONTROLRM'), 5000);
    });

  test.it('Add new record - remove area 0', function() {
    chromeDriver.wait(until.elementLocated(By.id('rm.area.0')), 3000);
    let input = chromeDriver.findElement(By.id('rm.area.0'));
    input.click();
  });

  test.it('Add new record - set drr', function() {
    // set drrs
    chromeDriver.wait(until.elementLocated(By.id('drrs')), 3000);
    let input = chromeDriver.findElement(By.id('drrs'));
    input.click();
    input.sendKeys('TestDRR');
  });

  test.it('Add new record - set status', function() {
    // set the status
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    let input = chromeDriver.findElement(By.id('status'));
    input.click();
    input.sendKeys('Ready for beam');

    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
  });

  test.it('Add new record - set status date', function() {
    // set status date
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
    let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(
      By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
    input.click();
  });

  test.it('Add new record - set vvResultsLoc', function() {
    this.timeout(10000);
    // set vvResultsLoc
    chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
    let input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.0')), 3000);
    let input0 = chromeDriver.findElement(By.id('vvResultsLoc.0'));
    input0.sendKeys('http://resultservtest.com/resultsdoc0');
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.1')), 3000);
    let input1 = chromeDriver.findElement(By.id('vvResultsLoc.1'));
    input1.sendKeys('http://resultservtest.com/resultsdoc1');
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.2')), 3000);
    let input2 = chromeDriver.findElement(By.id('vvResultsLoc.2'));
    input2.sendKeys('http://resultservtest.com/resultdoc2');
    // remove the first entry
    chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')), 3000);
    input = chromeDriver.findElement(By.id('rm.vvResultsLoc.0'));
    input.click();

    chromeDriver.findElement(By.id('submitBtn')).click();
  });


  test.it('should show the details record', function () {
    this.timeout(8000);
    chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
  });

  test.it('should show the correct installtion host in details', function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
    chromeDriver.findElement(By.id('host')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('testHost1');
      });
  });

  test.it('should show the correct installtion name in details', function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
    chromeDriver.findElement(By.id('name')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('Test name');
      });
  });

  test.it('should show the correct installtion software in details', function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
    chromeDriver.findElement(By.id('software')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('BEAST/b12/0.2');
      });
  });

  test.it('should show the correct installtion area in details', function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('area')), 3000);
    chromeDriver.findElement(By.id('area')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('IFS:LAB.FRIB.ASD.ACCELERATOROPS.MACHINEOPERATORS,ADB:AREA.NSCL.CONTROLRM');
      });
  });

  test.it('should show the correct installtion DRR in details', function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('drrs')), 3000);
    chromeDriver.findElement(By.id('drrs')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('TestDRR');
      });
  });

  test.it('should show the correct installtion status in details', function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('Ready for beam');
      });
  });
  // need date test
  // test.it("should show the correct installtion status date in details", function () {
  //   this.timeout(8000);
  //   chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
  //   chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

  test.it('should show the correct vvResultsLoc in details', function () {
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
    chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
      function (text) {
        expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
      });
  });
});
