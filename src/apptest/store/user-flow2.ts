import server = require('../../app/server');
import chai = require('chai');
import Supertest = require('supertest');
import TestTools = require('./TestTools');
import webdriver = require('selenium-webdriver');
import test = require('selenium-webdriver/testing');
import dbg = require('debug');
import CommonTools = require('../../app/lib/CommonTools');
import chaiAsPromised = require('chai-as-promised');

const debug = dbg('swdb:user-flow2-tests');
let ctools = new CommonTools.CommonTools();
let props: CommonTools.IProps;
let expect = chai.expect;
chai.use(chaiAsPromised);
props = ctools.getConfiguration();
let app;
let supertest: Supertest.SuperTest<Supertest.Test>;
let testTools = new TestTools.TestTools();
let By = webdriver.By;
let until = webdriver.until;

/**
 * Test flow built around a specified set of FRIB data:
 * https://docs.google.com/document/d/17mlTs5Ccqjw0h-_fzi4Gd_jIESnvxBRbNhjEcxK6kvs
 *
 */


test.describe('User flow2 tests', () => {
  let chromeDriver: webdriver.WebDriver;
  before('Prep DB', async () => {
    app = await server.start();
    supertest = Supertest(app);
    debug('Prep DB');
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after('clear db', async () => {
    debug('Clear DB');
    // clear the test collection.
    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  /**
   * 1. Make a new SW record
   */
  test.it('should show search page with login button', function(this: Mocha.ITestCallbackContext) {
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

  test.it('login as test user', function(this: Mocha.ITestCallbackContext, done: MochaDone){
    this.timeout(8000);
    supertest
    .get('/login')
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end((err, res) => {
      if (err) {
        done(err);
      } else {
        let Cookies = res.header['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + Cookies);
        let parts = Cookies.split('=');
        debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
        chromeDriver.manage().addCookie({name: parts[0], value: parts[1]});
        done();
      }
    });
  });

  test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it('should show new page with username on logout button', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/new');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it('should show the requested sw record title', () => {
    chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
  });

  test.describe('1. Add initial software record', () => {
    test.it('Add new sw record - set name', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
      chromeDriver.findElement(By.id('swName')).sendKeys('EXTA IOC');
    });

    test.it('Add new sw record - set owner', function (this: Mocha.ITestCallbackContext) {
      this.timeout(10000);
      chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
      let input = chromeDriver.findElement(By.id('owner'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('IFS:LAB.FRIB.ASD.CONTROLS.HLCO');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-0"]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-0"]'));
      input.click();
    });

    test.it('Set software status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('06/13/2018');
    });

    test.it('Submit', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('2. Update the new software record', () => {
    /**
     * 2. Update the new software record
     */

    test.it('should show the sw details record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // check result
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
    });

    test.it('should show the correct software name in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
      chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('EXTA IOC');
        });
    });

    test.it('should show the correct software owner in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
      chromeDriver.findElement(By.id('owner')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.HLCO');
        });
    });

    test.it('should show the correct software status date in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('6/13/2018');
        });
    });

    test.it('update this record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('should show the sw update title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update'), 5000);
    });

    test.it('Update sw record - set version', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
      chromeDriver.findElement(By.id('version')).sendKeys('2.3.5');
    });

    test.it('Update sw record - set description', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
      chromeDriver.findElement(By.id('desc')).sendKeys('New Input/Output controller for Extreme Aquisition');
    });

    test.it('Update sw record - set desc doc', () => {
      chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
      let input = chromeDriver.findElement(By.id('descDocLoc'));
      input.click();
      input.sendKeys('FRIB-T10500-CM-000228-001');
    });

    test.it('Update sw record - set design desc doc', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set design description document
      chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
      let input = chromeDriver.findElement(By.id('designDescDocLoc'));
      input.click();
      input.sendKeys('FRIB-T10500-ED-00422-002');
    });

    test.it('Update sw record - set level of care', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set level of care
      chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
      let input = chromeDriver.findElement(By.id('levelOfCare'));
      input.click();
      input.sendKeys('Medium');
    });

    test.it('Update sw record - set platforms', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set platforms
      chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
      let input = chromeDriver.findElement(By.id('platforms'));
      input.click();
      input.sendKeys('Linux (x86_64, arm64)');
    });

    test.it('Update sw record - set vvProcLoc', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set vvProcLoc
      chromeDriver.wait(until.elementLocated(By.id('add.vvProcLoc')), 3000);
      let input = chromeDriver.findElement(By.id('add.vvProcLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.0')), 3000);
      let input0 = chromeDriver.findElement(By.id('vvProcLoc.0'));
      input0.sendKeys('FRIB-T10500-ED-00422-002');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.1')), 3000);
      let input1 = chromeDriver.findElement(By.id('vvProcLoc.1'));
      input1.sendKeys('http://example.com/docs/FRIB-T10500-ED-00422-002.pdf');
    });

    test.it('Update sw record - set version control', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set version control
      chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
      let input = chromeDriver.findElement(By.id('versionControl'));
      input.click();
      input.sendKeys('Git');
    });

    test.it('Update sw record - set version control loc', () => {
      // set version control location
      chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
      let input = chromeDriver.findElement(By.id('versionControlLoc'));
      input.click();
      input.sendKeys('http://git.example.com/repo/exta');
    });

    test.it('Update sw record - set comment', () => {
      // set version control location
      chromeDriver.wait(until.elementLocated(By.id('comment')), 3000);
      let input = chromeDriver.findElement(By.id('comment'));
      input.click();
      input.sendKeys('This software record is for testing purposes only!');
    });


    test.it('Update sw record - set status Development', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set status
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');
      input.sendKeys(webdriver.Key.ENTER);
    });
  });

  test.describe('3. SW update version & branch fields disable on Ready for install', () => {
    /**
     * 3. On the update screen, check that the branch and version fields
     * are disabled if the status is Ready for install.
     */
    test.it('Update sw record - version field disabled in Ready for Install',
     function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
      let input = chromeDriver.findElement(By.id('version'));
      chromeDriver.wait(until.elementIsDisabled(input), 3000);
    });

    test.it('Update sw record - branch field disabled in Ready for Install',
     function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
      let input = chromeDriver.findElement(By.id('branch'));
      chromeDriver.wait(until.elementIsDisabled(input), 3000);
    });

    test.it('Update sw record - set engineer', async function (this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
      let input = chromeDriver.findElement(By.id('engineer'));
      // chromeDriver.executeScript('scroll(0, -250);');
      input.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
      input.sendKeys('MAXWELLD');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-3-0"]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-3-0"]'));
      input.click();
    });

    test.it('Submit', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the sw details record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(10000);
      // check result
      chromeDriver.wait(until.titleIs('SWDB - Details'), 10000);
    });
  });

  test.describe('4. Make a new installation record', () => {
    /**
     * 4. Make a new installation record
     */
    test.it('should show search page with username on logout button', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/inst/new');
      chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()), 5000);
    });

    test.it('should show the new installation page title', () => {
      chromeDriver.wait(until.titleIs('SWDB - New Installation'), 5000);
    });
    test.it('Add new inst record - set host', function (this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      let input = chromeDriver.findElement(By.id('host'));
      input.sendKeys('vmachine01');
    });

    test.it('Add new inst record - set software', function (this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      // set software
      chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
      let searchInput = chromeDriver.findElement(By.id('software'));
      searchInput.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = chromeDriver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('EXTA IOC');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-4-0"]/span')), 5000);
    });

    test.it('Add new inst record - click row', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-4-0"]/span'));
      input.click();
    });

    test.it('Add new inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('06/13/2018');
    });

    test.it('Add new inst record - set area 0', function (this: any) {
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
      input0b.sendKeys('FRIB.FRONTEND');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-5-0"]/span')));
      let inputZero = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-5-0"]/span'));
      inputZero.click();
    });

    test.it('Add new inst record - set area 1', function (this: any) {
      this.timeout(6000);
      chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
      let input = chromeDriver.findElement(By.id('add.area'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('area.1')), 3000);
      let input1 = chromeDriver.findElement(By.id('area.1'));
      input1.click();

      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/input[1]')), 3000);
      let input1b = chromeDriver.findElement(By.xpath('//*[@id="area.1"]/input[1]'));
      input1b.sendKeys('FRIB.LINACSEG');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-6-0"]/span')));
      let inputOne = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-6-0"]/span'));
      inputOne.click();
    });

    test.it('Add new record - set drr', () => {
      // set drrs
      chromeDriver.wait(until.elementLocated(By.id('drrs')), 3000);
      let input = chromeDriver.findElement(By.id('drrs'));
      input.click();
      input.sendKeys('DDR05');
    });

    test.it('Add new record - set status', () => {
      // set the status
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');

      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    });

    test.it('Submit', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the inst details record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(10000);
      // check result
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 10000);
    });
  });

  test.describe('5. Update the installation record - Ready for verification status', () => {
    /**
     * 5. Update the installation record - Ready for verification status
     */
    test.it('update this inst record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('Update inst record - set name', () => {
      // set drrs
      chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
      let input = chromeDriver.findElement(By.id('name'));
      input.click();
      input.sendKeys('FE EXTA IOC');
    });

    test.it('Update inst record - set status', () => {
      // set the status
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for verification');

    });

    test.it('Update inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('06/14/2018');
    });

    test.it('Submit "Ready for verification" update', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the inst details record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(10000);
      // check result
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 10000);
    });
  });

  test.describe('6. Update the installation record - Ready for beam status', () => {
    /**
     * 6. Update the installation record - Ready for beam status
     */
    test.it('update this inst record 2', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('Update2 inst record - set status', () => {
      // set the status
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for beam');

    });

    test.it('Update inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/15/2018');
    });

    test.it('Update inst record - set V&V apprval date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('vvApprovalDate')), 3000);
      let input = chromeDriver.findElement(By.id('vvApprovalDate'));
      input.clear();
      input.sendKeys('06/15/2018');
    });

    test.it('Update inst record - set vvResultsLoc', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set vvResultsLoc
      chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
      let input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.0')), 3000);
      let input0 = chromeDriver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('FRIB-T10384-TP-000942-001');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.1')), 3000);
      let input1 = chromeDriver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://example.com/docs/FRIB-T10384-TP-00942-001.pdf');
    });

    test.it('Submit "Ready for beam" update', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the inst details record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(10000);
      // check result
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 10000);
    });
  });

  test.describe('7. Update software to Development status', () => {
    /**
     * 7. Update software to Development status
     */
    test.it('should find the sw record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/list');
      chromeDriver.wait(until.elementLocated(By.id('swNameSrch')), 8000)
        .sendKeys('EXTA IOC');
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000);
    });

    // find the created record and click update
    test.it('should show record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000).click();
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('should show the update title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update'), 5000);
    });

    test.it('Update2 inst record - set status', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Development');
    });

    test.it('Update inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/15/2018');
    });

    test.it('Submit "Development" update', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the correct error', () => {
      chromeDriver.wait(until.elementLocated(By.id('formError')), 3000);
      chromeDriver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Software state cannot change while there are active installations/);
        });
    });
  });


  test.describe('8. Attempt to bump the version to the same as existing version number', () => {
    /**
     * 8. Attempt to bump the version to the same as existing version number
     */
    test.it('should find the sw record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/list');
      chromeDriver.wait(until.elementLocated(By.id('swNameSrch')), 8000)
        .sendKeys('EXTA IOC');
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000);
    });

    // find the created record and click update
    test.it('should show record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000).click();
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('bumpVerBtn')),
        8000).click();
    });

    test.it('Should go to a prepopulated software update page', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
    });
  });

  test.describe('9. Attempt to update set to duplicate version', () => {
  /**
   * 9. Attempt to update set to duplicate version
   */

  // test.it('Update sw record - set version', function(this: Mocha.ITestCallbackContext) {
  //   this.timeout(5000);
  //   chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
  //   chromeDriver.findElement(By.id('version')).sendKeys('2.3.5');
  // });

  // test.it('Set software status date', function (this: Mocha.ITestCallbackContext) {
  //   this.timeout(5000);
  //   chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
  //   let input = chromeDriver.findElement(By.id('statusDate'));
  //   input.clear();
  //   input.sendKeys('06/16/2018');
  // });

  // test.it('Submit "bump software version" request',  () => {
  //   chromeDriver.findElement(By.id('submitBtn')).click();
  // });

  // test.it('should show the correct error', () => {
  //   chromeDriver.wait(until.titleIs('SWDB - Update'), 2000);
  //   chromeDriver.wait(until.elementLocated(By.id('formError')), 3000);
  //   chromeDriver.findElement(By.id('formError')).getText().then(
  //     (text) => {
  //       expect(text).to.match(/duplicate key error/);
  //     });
  // });
  });

  test.describe('10. Try to update verision to unique number', () => {
    /**
     * 10. Try to update verision to unique number
     */
    test.it('Update sw record - set version', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
      chromeDriver.findElement(By.id('version')).sendKeys('2.3.6');
    });

    test.it('Submit "bump software version" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
    });
  });

  test.describe('11. Update status of bumped version to Ready for install', () => {
    /**
     * 11. Update status of bumped version to Ready for install
     */
    test.it('should find the sw record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/list');
      chromeDriver.wait(until.elementLocated(By.id('swNameSrch')), 8000)
        .sendKeys('EXTA IOC');
      chromeDriver.wait(until.elementLocated(By.id('versionSrch')), 8000)
        .sendKeys('2.3.6');
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000);
    });

    // find the created record and click update
    test.it('should show record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000).click();
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('should show the update title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update'), 5000);
    });

    test.it('Set software status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/18/2018');
    });

    test.it('Update software record - set status', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');
    });

    test.it('Submit "update software version" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('12. Update installation status as Ready for install', () => {
    /**
     * 12. Update installation status as Ready for install
     */

    test.it('should find the installation record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/inst/list');
      chromeDriver.wait(until.elementLocated(By.id('hostSrch')), 8000)
        .sendKeys('vmachine01');
      chromeDriver.wait(until.elementLocated(By.linkText('vmachine01')),
        8000).click();
    });

    test.it('should show installation record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('should show the update title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update Installation'), 5000);
    });

    test.it('Update inst record - set status', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');
    });

    test.it('Update inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/20/2018');
    });

    test.it('Update inst record - set vvResultsLoc', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.1')), 3000);
      let input1 = chromeDriver.findElement(By.id('rm.vvResultsLoc.1'));
      input1.click();
      chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')), 3000);
      let input0 = chromeDriver.findElement(By.id('rm.vvResultsLoc.0'));
      input0.click();
    });

    test.it('Update inst record - software field should be disabled',
      function (this: Mocha.ITestCallbackContext) {
        this.timeout(5000);
        chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
        let input = chromeDriver.findElement(By.id('software'));
        chromeDriver.wait(until.elementIsDisabled(input), 3000);
      });

    test.it('Submit "update installation version" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });

    test.it('should show the correct sw field in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      chromeDriver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Ready for install');
        });
    });
  });

  test.describe('13. Update installation to sw field "EXTA IOC//2.3.6"', () => {
    /**
     * 13. Update installation status as Ready for install
     */

    test.it('should show installation record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('should show the update title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update Installation'), 5000);
    });

    test.it('Add new inst record - set software', async function (this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      // set software

      chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
      let searchInput = chromeDriver.findElement(By.id('software'));
      searchInput.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = chromeDriver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('2.3.6');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-22-0"]/span')),
       5000).click();

    });

    test.it('Submit "update installation version" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });

    test.it('should show the correct sw field in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
      chromeDriver.findElement(By.id('software')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('EXTA IOC / / 2.3.6');
        });
    });
  });

  test.describe('14. Update installation status as Ready for verification', () => {
    /**
     * 14. Update installation status as Ready for verification
     */
    test.it('should show installation record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('Update inst record - set status', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for verification');
    });

    test.it('Update inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/21/2018');
    });

    test.it('Submit "update installation version" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });
  });

  test.describe('15. Update installation status as Ready for beam', () => {
    test.it('should show installation record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('Update inst record - set status', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for beam');
    });

    test.it('Update inst record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/22/2018');
    });

    test.it('Update inst record - set V&V apprval date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('vvApprovalDate')), 3000);
      let input = chromeDriver.findElement(By.id('vvApprovalDate'));
      input.clear();
      input.sendKeys('06/22/2018');
    });

    test.it('Update inst record - set vvResultsLoc', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      // set vvResultsLoc
      chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
      let input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.0')), 3000);
      let input0 = chromeDriver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('FRIB-T10384-TP-000942-002');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.1')), 3000);
      let input1 = chromeDriver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://example.com/docs/FRIB-T10384-TP-00942-002.pdf');
    });

    test.it('Submit "update installation version" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });
  });

  test.describe('16. Update software status as Deprecated', () => {
    test.it('should find the sw record', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/list');
      chromeDriver.wait(until.elementLocated(By.id('swNameSrch')), 8000)
        .sendKeys('EXTA IOC');
      chromeDriver.wait(until.elementLocated(By.id('versionSrch')), 8000)
        .sendKeys('2.3.5');
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000);
    });

    // find the created record and click update
    test.it('should show record details', function (this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.linkText('EXTA IOC')),
        8000).click();
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });

    test.it('should show the update title', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update'), 5000);
    });

    test.it('Update sw record - set status', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      let input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('DEPRECATED');
    });

    test.it('Update sw record - set status date', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      let input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/22/2018');
    });

    test.it('Submit "update sw status" request', () => {
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', function (this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
    });

    test.it('should show the correct sw status in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      chromeDriver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('DEPRECATED');
        });
    });

    test.it('should show the correct sw status date in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('6/22/2018');
        });
    });
  });

});
