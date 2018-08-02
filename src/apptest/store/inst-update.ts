import chai = require('chai');
import dbg = require('debug');
import Supertest = require('supertest');
import server = require('../../app/server');
const expect = chai.expect;
let app;
let supertest: any;
import chaiaspromised = require('chai-as-promised');
chai.use(chaiaspromised);

import TestTools = require('./TestTools');
const testTools = new TestTools.TestTools();

import webdriver = require('selenium-webdriver');
const By = webdriver.By;
const until = webdriver.until;
import test = require('selenium-webdriver/testing');
const debug = dbg('swdb:inst-update-tests');

import CommonTools = require('../../app/lib/CommonTools');
const ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();

export {};

test.describe('Installations update screen tests', () => {
  let chromeDriver: any;
  let tmpStatusDate: Date;
  let tmpVvApprovalDate: Date;

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


  test.describe('1. should add a new installation record', () => {
    test.it('should show search page with login button', function(this: any) {
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

    test.it('login as test user', function(this: any, done: MochaDone) {
      this.timeout(8000);
      supertest
        .get('/login')
        .auth(props.test.username, props.test.password)
        .timeout(8000)
        .expect(302)
        .end((err: Error, res: Express.Session) => {
          if (err) {
            done(err);
          } else {
            const Cookies = res.headers['set-cookie'].pop().split(';')[0];
            debug('test login cookies: ' + Cookies);
            const parts = Cookies.split('=');
            debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
            chromeDriver.manage().addCookie({ name: parts[0], value: parts[1] });
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

    test.it('should show update page with username on logout button', function(this: any) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/inst/new');
      chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()), 5000);
    });


    test.it('should show the requested installation record title', () => {
      chromeDriver.wait(until.titleIs('SWDB - New Installation'), 5000);
    });

    test.it('Set the host', () => {
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      const input = chromeDriver.findElement(By.id('host'));
      input.sendKeys('testHost1');
    });

    test.it('Add new record - set name', () => {
      // set name
      chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
      const input = chromeDriver.findElement(By.id('name'));
      input.click();
      input.sendKeys('Test name');
    });

    test.it('Add new record - set area 0', function(this: any) {
      this.timeout(6000);
      // set area
      // add controls room, operator area, nscl control room
      // then delete the controls room
      chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
      const input = chromeDriver.findElement(By.id('add.area'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('area.0')), 3000);
      const input0 = chromeDriver.findElement(By.id('area.0'));
      input0.click();

      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.0"]/input[1]')), 3000);
      const input0b = chromeDriver.findElement(By.xpath('//*[@id="area.0"]/input[1]'));
      input0b.sendKeys('controls\n');

      chromeDriver.wait(until.elementTextContains(input0,
        'IFS:LAB.FRIB.ASD.CONTROLS.HLCO'), 5000);
    });

    test.it('Add new record - set area 1', function(this: any) {
      this.timeout(6000);
      chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
      const input = chromeDriver.findElement(By.id('add.area'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('area.1')), 3000);
      const input1 = chromeDriver.findElement(By.id('area.1'));
      input1.click();

      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/input[1]')), 3000);
      const input1b = chromeDriver.findElement(By.xpath('//*[@id="area.1"]/input[1]'));
      input1b.sendKeys('operator\n');

      chromeDriver.wait(until.elementTextContains(input1,
        'IFS:LAB.FRIB.ASD.ACCELERATOROPS.MACHINEOPERATORS'), 5000);
    });

    test.it('Add new record - set area 2', function(this: any) {
      this.timeout(6000);
      chromeDriver.wait(until.elementLocated(By.id('add.area')), 3000);
      const input = chromeDriver.findElement(By.id('add.area'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('area.2')), 3000);
      const input2 = chromeDriver.findElement(By.id('area.2'));
      input2.click();

      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.2"]/input[1]')), 3000);
      const input2b = chromeDriver.findElement(By.xpath('//*[@id="area.2"]/input[1]'));
      input2b.sendKeys('control room\n');

      chromeDriver.wait(until.elementTextContains(input2,
        'ADB:AREA.NSCL.CONTROLRM'), 5000);
    });

    test.it('Add new record - remove area 0', () => {
      chromeDriver.wait(until.elementLocated(By.id('rm.area.0')), 3000);
      const input = chromeDriver.findElement(By.id('rm.area.0'));
      input.click();
    });

    test.it('Set the status', () => {
      // set status
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      const input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');

      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    });

    test.it('Set the status date', function(this: any) {
      this.timeout(10000);
      // set status date
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      tmpStatusDate = new Date();
    });

    test.it('Add new record - set V&V Approval date', () => {
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="vvApprovalDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="vvApprovalDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="vvApprovalDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(By.xpath('//*[@id="vvApprovalDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      tmpVvApprovalDate = new Date();
    });

    test.it('Set the software', function(this: any) {
      this.timeout(15000);
      // set software
      chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
      let searchInput = chromeDriver.findElement(By.id('software'));
      searchInput.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = chromeDriver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('BEAST');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-0"]/span')));
      const input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-0"]/span'));
      input.click();
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
        By.id('software')),
        'BEAST/b12/0.2'), 3000);
    });

    test.it('set V&V results loc0 for new installation record', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
      const input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.0')), 3000);
      const input0 = chromeDriver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('http://resultservtest.com/resultsdoc0');
    });

    test.it('set V&V results loc1 for new installation record', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
      const input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.1')), 3000);
      const input1 = chromeDriver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://resultservtest.com/resultsdoc1');
    });

    test.it('set V&V results loc2 for new installation record', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
      const input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.2')), 3000);
      const input2 = chromeDriver.findElement(By.id('vvResultsLoc.2'));
      input2.sendKeys('http://resultservtest.com/resultdoc2');
    });
    test.it('remove V&V results loc0 for new installation record', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      // remove the first entry
      chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')), 3000);
      const input = chromeDriver.findElement(By.id('rm.vvResultsLoc.0'));
      input.click();
    });

    test.it('should show the details record', function(this: any) {
      this.timeout(8000);
      chromeDriver.findElement(By.id('submitBtn')).click();
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });
  });

  test.describe('2. should show installation details', () => {
    test.it('should show the correct installtion host in details', () => {
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      chromeDriver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost1');
        });
    });
  });

  test.describe('3. should update installation', () => {
    test.it('should go to update record', function(this: any) {
      this.timeout(4000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')), 3000);
      chromeDriver.findElement(By.id('updateBtn')).click();
      chromeDriver.wait(until.titleIs('SWDB - Update Installation'), 5000);
    });

    test.it('should show the correct host in update', () => {
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      chromeDriver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost1');
        });
    });

    test.it('should update installation host', () => {
      chromeDriver.wait(until.titleIs('SWDB - Update Installation'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      const input = chromeDriver.findElement(By.id('host'));
      input.clear();
      input.sendKeys('testHost2');
    });

    test.it('should show the correct name in update', () => {
      chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
      chromeDriver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test name');
        });
    });

    test.it('should show the correct area.0 in update', () => {
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.0"]/div[1]/span/span[2]/span')), 3000);
      chromeDriver.findElement(By.xpath('//*[@id="area.0"]/div[1]/span/span[2]/span')).getText().then(
        (text: string) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.ACCELERATOROPS.MACHINEOPERATORS');
        });
    });

    test.it('should show the correct area.1 in update', () => {
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/div[1]/span/span[2]/span')), 3000);
      chromeDriver.findElement(By.xpath('//*[@id="area.1"]/div[1]/span/span[2]/span')).getText().then(
        (text: string) => {
          expect(text).to.equal('ADB:AREA.NSCL.CONTROLRM');
        });
    });

    test.it('should show the correct status in update', () => {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      chromeDriver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for install');
        });
    });

    test.it('should show the status date in update', () => {
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            ('0' + (tmpStatusDate.getMonth() + 1)).slice(-2) + '/' +
            ('0' + tmpStatusDate.getDate()).slice(-2) + '/' +
            tmpStatusDate.getFullYear());
        });
    });

    test.it('should show the vvApprovalDate in update', () => {
      chromeDriver.wait(until.elementLocated(By.id('vvApprovalDate')), 3000);
      chromeDriver.findElement(By.id('vvApprovalDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            ('0' + (tmpVvApprovalDate.getMonth() + 1)).slice(-2) + '/' +
            ('0' + tmpVvApprovalDate.getDate()).slice(-2) + '/' +
            tmpVvApprovalDate.getFullYear());
        });
    });

    test.it('submit update form', () => {
      chromeDriver.wait(until.elementLocated(By.id('submitBtn')), 3000);
      chromeDriver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('4. should show updated installation details', () => {
    test.it('should show the details record', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });

    test.it('should show the correct installtion host in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      chromeDriver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost2');
        });
    });

    test.it('should show the correct installtion name in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
      chromeDriver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test name');
        });
    });

    test.it('should show the correct installtion software in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
      chromeDriver.findElement(By.id('software')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('BEAST / b12 / 0.2');
        });
    });

    test.it('should show the correct installtion area in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('area')), 3000);
      chromeDriver.findElement(By.id('area')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.ACCELERATOROPS.MACHINEOPERATORS,ADB:AREA.NSCL.CONTROLRM');
        });
    });

    test.it('should show the correct installtion DRR in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('drrs')), 3000);
      chromeDriver.findElement(By.id('drrs')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion status in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      chromeDriver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for install');
        });
    });

    test.it('should show the correct installtion V&V results in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
      chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
        });
    });

    test.it('should show changes in the history table of details', function(this: any) {
      this.timeout(20000);
      // *[@id="histTable"]/tbody/tr[2]/td[2] shold be "New Test Description2"
      chromeDriver.wait(until.elementLocated(By.id('hist.0')), 3000);
      const input = chromeDriver.findElement(By.id('hist.0'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('histPathName.0.0')), 3000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
        By.id('histPathName.0.0')),
        'host'), 3000);
      chromeDriver.wait(until.elementLocated(By.id('histPathValue.0.0')), 3000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
        By.id('histPathValue.0.0')),
        'testHost2'), 3000);
    });
  });

  test.describe('5. should update installation clearing optional fields', () => {
    test.it('should go to update record', function(this: any) {
      this.timeout(4000);
      chromeDriver.wait(until.elementLocated(By.id('updateBtn')), 3000);
      chromeDriver.findElement(By.id('updateBtn')).click();
      chromeDriver.wait(until.titleIs('SWDB - Update Installation'), 5000);
    });

    test.it('clear name field', () => {
      chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
      const input = chromeDriver.findElement(By.id('name'));
      input.clear();
    });

    test.it('clear V&V results fields', () => {
      chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.1')), 3000);
      let input = chromeDriver.findElement(By.id('rm.vvResultsLoc.1'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')), 3000);
      input = chromeDriver.findElement(By.id('rm.vvResultsLoc.0'));
      input.click();
    });

    test.it('clear V&V date', () => {
      chromeDriver.wait(until.elementLocated(By.id('vvApprovalDate')), 3000);
      const input = chromeDriver.findElement(By.id('vvApprovalDate'));
      input.clear();
    });

    test.it('submit update form', () => {
      chromeDriver.wait(until.elementLocated(By.id('submitBtn')), 3000);
      chromeDriver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('6. should show updated installation details', () => {
    test.it('should show the details record', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.titleIs('SWDB - Installation Details'), 5000);
    });

    test.it('should show the correct installtion host in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('host')), 3000);
      chromeDriver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost2');
        });
    });

    test.it('should show the correct installtion name in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('name')), 3000);
      chromeDriver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion software in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('software')), 3000);
      chromeDriver.findElement(By.id('software')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('BEAST / b12 / 0.2');
        });
    });

    test.it('should show the correct installtion area in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('area')), 3000);
      chromeDriver.findElement(By.id('area')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.ACCELERATOROPS.MACHINEOPERATORS,ADB:AREA.NSCL.CONTROLRM');
        });
    });

    test.it('should show the correct installtion DRR in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('drrs')), 3000);
      chromeDriver.findElement(By.id('drrs')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion status in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      chromeDriver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for install');
        });
    });

    test.it('should show the correct installtion V&V results in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
      chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion V&V results date in details', function(this: any) {
      this.timeout(8000);
      chromeDriver.wait(until.elementLocated(By.id('vvApprovalDate')), 3000);
      chromeDriver.findElement(By.id('vvApprovalDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });
  });
});
