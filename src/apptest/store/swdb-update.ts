/**
 * Tests for Software 'update' page.
 */
import * as util from 'util';

import {expect} from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as test from 'selenium-webdriver/testing';
import * as SuperTest from 'supertest';

import * as server from '../../app/server';

import * as data from '../data';
import * as cookies from '../lib/cookies';

const debug = Debug('swdb:swdb-update-tests');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';


test.describe('Software update screen tests', () => {
  let app: Application;
  let driver: WebDriver;
  let supertest: SuperTest.SuperTest<SuperTest.Test>;

  let tmpStatusDate: Date;

  before('Start Application', async () => {
    app = await server.start();
    supertest = SuperTest(app);
  });

  before('Init Database', async () => {
    await data.initialize();
  });

  before('Init WebDriver',  async () => {
    driver = await new Builder().forBrowser(browser).build();
  });

  after('Quit WebDriver', async () => {
    await driver.quit();
  });

  after('Stop Application', async () => {
    await server.stop();
  });

  test.describe('1. should add a new software record', () => {
    test.it('should show search page with login button', function(this: Mocha.ITestCallbackContext) {
      // prefs.setLevel(webdriver.logging.Type.BROWSER, webdriver.logging.Level.ALL);
      // options.setLoggingPrefs(prefs);
      driver.manage().window().setPosition(200, 0);
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')), 'Log in'));
    });

    test.it('login as test user by setting session cookie and refreshing', async () => {
      const res = await supertest.get('/login')
        .auth(props.test.username, props.test.password).expect(302);
      const sid = cookies.parseCookie(res, 'connect.sid');
      debug('Set WebDriver cookie: %s', util.inspect(sid));
      await driver.manage().addCookie(sid);
      await driver.navigate().refresh();
    });

    test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show new page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });


    test.it('should show the requested installation record title', () => {
      driver.wait(until.titleIs('SWDB - New'));
    });

    test.it('Add new record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).sendKeys('swdb-update-test');
    });

    test.it('set version for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set version
      driver.wait(until.elementLocated(By.id('version')));
      const input = driver.findElement(By.id('version'));
      input.click();
      input.sendKeys('Test Version');
    });

    test.it('set branch for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set branch
      driver.wait(until.elementLocated(By.id('branch')));
      const input = driver.findElement(By.id('branch'));
      input.click();
      input.sendKeys('Test branch');
    });

    test.it('set description for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set description
      driver.wait(until.elementLocated(By.id('desc')));
      const input = driver.findElement(By.id('desc'));
      input.click();
      input.sendKeys('Test description');
    });

    test.it('set description doc for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set description document
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      const input = driver.findElement(By.id('descDocLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('set design description doc for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set design description document
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      const input = driver.findElement(By.id('designDescDocLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('set owner for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set owner
      driver.wait(until.elementLocated(By.id('owner')));
      let input = driver.findElement(By.id('owner'));
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('controls');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-2"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-2"]'));
      input.click();
    });

    test.it('set level of care for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set level of care
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      const input = driver.findElement(By.id('levelOfCare'));
      input.click();
      input.sendKeys('Low');
    });

    test.it('set status for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Development');
    });

    test.it('set status date for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set status date
      driver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')));
      let input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')));
      input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      tmpStatusDate = new Date();
    });

    test.it('set platforms for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set platforms
      driver.wait(until.elementLocated(By.id('platforms')));
      const input = driver.findElement(By.id('platforms'));
      input.click();
      input.sendKeys('Test platform');
    });

    test.it('set V&V procedure loc for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set vvProcLoc
      driver.wait(until.elementLocated(By.id('add.vvProcLoc')));
      let input = driver.findElement(By.id('add.vvProcLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvProcLoc.0')));
      const input0 = driver.findElement(By.id('vvProcLoc.0'));
      input0.sendKeys('http://procservtest.com/procdoc0');
      input.click();
      driver.wait(until.elementLocated(By.id('vvProcLoc.1')));
      const input1 = driver.findElement(By.id('vvProcLoc.1'));
      input1.sendKeys('http://procservtest.com/procdoc1');
      input.click();
      driver.wait(until.elementLocated(By.id('vvProcLoc.2')));
      const input2 = driver.findElement(By.id('vvProcLoc.2'));
      input2.sendKeys('http://procservtest.com/procdoc2');
      // remove the first entry
      driver.wait(until.elementLocated(By.id('rm.vvProcLoc.0')));
      input = driver.findElement(By.id('rm.vvProcLoc.0'));
      input.click();
    });


    test.it('set V&V results loc for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set vvResultsLoc
      driver.wait(until.elementLocated(By.id('add.vvResultsLoc')));
      let input = driver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.0')));
      const input0 = driver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('http://resultservtest.com/resultsdoc0');
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.1')));
      const input1 = driver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://resultservtest.com/resultsdoc1');
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.2')));
      const input2 = driver.findElement(By.id('vvResultsLoc.2'));
      input2.sendKeys('http://resultservtest.com/resultdoc2');
      // remove the first entry
      driver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')));
      input = driver.findElement(By.id('rm.vvResultsLoc.0'));
      input.click();
    });

    test.it('set version control for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set version control
      driver.wait(until.elementLocated(By.id('versionControl')));
      const input = driver.findElement(By.id('versionControl'));
      input.click();
      input.sendKeys('Debian');
    });

    test.it('set version control loc for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set version control location
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      const input = driver.findElement(By.id('versionControlLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('set engineer for new sw record', function(this: Mocha.ITestCallbackContext) {
      // set engineer
      driver.wait(until.elementLocated(By.id('engineer')));
      let input = driver.findElement(By.id('engineer'));
      driver.executeScript('scroll(0, -250);');
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
      input.sendKeys('ellisr');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-1-0"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-1-0"]'));
      input.click();
    });

    test.it('Submit', () => {
      driver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('2. should show software details', () => {
    test.it('should show the details record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Details'));
    });

    test.it('should show the correct software name in details', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('swdb-update-test');
        });
    });

    test.it('should show the correct owner in details', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.findElement(By.id('owner')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.EBC');
        });
    });

    test.it('should show the correct engineer in details', () => {
      driver.wait(until.elementLocated(By.id('engineer')));
      driver.findElement(By.id('engineer')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('ELLISR');
        });
    });
  });

  test.describe('3. should find the new record', () => {
    // find the created record
    test.it('should find a record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('swdb-update-test');
      driver.wait(until.elementLocated(By.id('versionSrch')))
        .sendKeys('Test version');
      driver.wait(until.elementLocated(By.linkText('swdb-update-test')),
        8000);
    });

    // find the created record and click update
    test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('swdb-update-test')),
        8000).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });
  });

  test.describe('4. should show the correct data in update screen', () => {
    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('should show the correct software name in update', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('swdb-update-test');
        });
    });

    test.it('should show the correct software branch in update', () => {
      driver.wait(until.elementLocated(By.id('branch')));
      driver.findElement(By.id('branch')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test branch');
        });
    });

    test.it('should show the correct software version in update', () => {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test Version');
        });
    });

    test.it('should show the correct description in update', () => {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test description');
        });
    });

    test.it('should show the correct description doc in update', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct design description doc in update', () => {
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct owner in update', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.xpath('//*[@id="owner"]/div[1]/span/span[2]/span')),
        'IFS:LAB.FRIB.ASD.CONTROLS.EBC'));
    });

    test.it('should show the correct engineer in update', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('engineer')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.xpath('//*[@id="engineer"]/div[1]/span/span[2]/span')), 'ELLISR'));
    });

    test.it('should show the correct levelOfCare in update', () => {
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      driver.findElement(By.id('levelOfCare')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Low');
        });
    });

    test.it('should show the correct status in update', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Development');
        });
    });

    test.it('should show the status date in update', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            ('0' + (tmpStatusDate.getMonth() + 1)).slice(-2) + '/' +
            ('0' + tmpStatusDate.getDate()).slice(-2) + '/' +
            tmpStatusDate.getFullYear());
        });
    });

    test.it('should show the correct platforms in update', () => {
      driver.wait(until.elementLocated(By.id('platforms')));
      driver.findElement(By.id('platforms')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test platform');
        });
    });

    test.it('should show the correct versionControl in update', () => {
      driver.wait(until.elementLocated(By.id('versionControl')));
      driver.findElement(By.id('versionControl')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Debian');
        });
    });

    test.it('should show the correct versionControlLoc in update', () => {
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });
  });

  test.describe('5. should update the new record', () => {
    test.it('should update a record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('desc'))).clear();
      driver.wait(until.elementLocated(By.id('desc'))).sendKeys('New Test Description');
      driver.wait(until.elementLocated(By.id('submitBtn'))).click();
    });
  });

  test.describe('6. should show updated data from the new record details', () => {
    test.it('should show the details record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Details'), 20000);
    });

    test.it('should show the correct description in details', () => {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('New Test Description');
        });
    });

    test.it('should show the correct software name in details', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('swdb-update-test');
        });
    });

    test.it('should show the correct software branch in details', () => {
      driver.wait(until.elementLocated(By.id('branch')));
      driver.findElement(By.id('branch')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test branch');
        });
    });

    test.it('should show the correct software version in details', () => {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test Version');
        });
    });

    test.it('should show the correct description doc in details', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct design description doc in details', () => {
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct owner in details', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.findElement(By.id('owner')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.EBC');
        });
    });

    test.it('should show the correct engineer in details', () => {
      driver.wait(until.elementLocated(By.id('engineer')));
      driver.findElement(By.id('engineer')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('ELLISR');
        });
    });

    test.it('should show the correct levelOfCare in details', () => {
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      driver.findElement(By.id('levelOfCare')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Low');
        });
    });

    test.it('should show the correct status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Development');
        });
    });

    test.it('should show the status date in details', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            (tmpStatusDate.getMonth() + 1) + '/' +
            tmpStatusDate.getDate() + '/' +
            tmpStatusDate.getFullYear());
        });
    });

    test.it('should show the correct platforms in details', () => {
      driver.wait(until.elementLocated(By.id('platforms')));
      driver.findElement(By.id('platforms')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test platform');
        });
    });

    test.it('should show the correct vvProcLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvProcLoc')));
      driver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://procservtest.com/procdoc1,http://procservtest.com/procdoc2');
        });
    });

    test.it('should show the correct vvResultsLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvResultsLoc')));
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
        });
    });

    test.it('should show the correct versionControl in details', () => {
      driver.wait(until.elementLocated(By.id('versionControl')));
      driver.findElement(By.id('versionControl')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Debian');
        });
    });

    test.it('should show the correct versionControlLoc in details', () => {
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });
  });

  test.describe('7. should show correct field data for a version update', () => {
    /**
     * Click the version update button on the details page and check field defaults on
     * the resulting new record page.
     */
    test.it('should click new version shows new record page ', () => {
      driver.wait(until.elementLocated(By.id('bumpVerBtn')),
        8000).click();
      driver.wait(until.titleIs('SWDB - New'));
    });

    test.it('should show the correct description in bump version new', () => {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('New Test Description');
        });
    });

    test.it('should show the correct software name in bump version new', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('swdb-update-test');
        });
    });

    test.it('should show the correct software branch in bump version new', () => {
      driver.wait(until.elementLocated(By.id('branch')));
      driver.findElement(By.id('branch')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct software version in bump version new', () => {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct description doc in bump version new', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct design description doc in bump version new', () => {
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct owner in bump version new', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.xpath('//*[@id="owner"]/div[1]/span/span[2]/span')),
        'IFS:LAB.FRIB.ASD.CONTROLS.EBC'));
    });

    test.it('should show the correct engineer in bump version new', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('engineer')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.xpath('//*[@id="engineer"]/div[1]/span/span[2]/span')), 'ELLISR'));
    });

    test.it('should show the correct levelOfCare in bump version new', () => {
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      driver.findElement(By.id('levelOfCare')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Low');
        });
    });

    test.it('should show the correct status in bump version new', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Development');
        });
    });

    test.it('should show the correct platforms in bump version new', () => {
      driver.wait(until.elementLocated(By.id('platforms')));
      driver.findElement(By.id('platforms')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test platform');
        });
    });

    test.it('should show the correct versionControl in bump version new', () => {
      driver.wait(until.elementLocated(By.id('versionControl')));
      driver.findElement(By.id('versionControl')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Debian');
        });
    });

    test.it('should show the correct versionControlLoc in bump version new', () => {
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });
  });


  test.describe('8. should perform a version update', () => {
    /**
     * Update the branch and version and check the resulting details screen
     */
    test.it('should update the branch and version and submit ', function(this: Mocha.ITestCallbackContext) {
      // set version
      driver.wait(until.elementLocated(By.id('version')));
      let input = driver.findElement(By.id('version'));
      driver.executeScript('scroll(0, -250);');
      input.click();
      input.sendKeys('Bumped Version');

      // set branch
      driver.wait(until.elementLocated(By.id('branch')));
      input = driver.findElement(By.id('branch'));
      driver.executeScript('scroll(0, -250);');
      input.click();
      input.sendKeys('Bumped Branch');
      driver.wait(until.elementLocated(By.id('submitBtn')),
        8000).click();
      driver.wait(until.titleIs('SWDB - Details'));
    });
  });

  test.describe('9. should show correct detail after a version update', () => {
    test.it('should show the correct description in details', () => {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('New Test Description');
        });
    });

    test.it('should show the correct software name in details', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('swdb-update-test');
        });
    });

    test.it('should show the correct software branch in details', () => {
      driver.wait(until.elementLocated(By.id('branch')));
      driver.findElement(By.id('branch')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Bumped Branch');
        });
    });

    test.it('should show the correct software version in details', () => {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Bumped Version');
        });
    });

    test.it('should show the correct description doc in details', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct design description doc in details', () => {
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct owner in details', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.findElement(By.id('owner')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.EBC');
        });
    });

    test.it('should show the correct engineer in details', () => {
      driver.wait(until.elementLocated(By.id('engineer')));
      driver.findElement(By.id('engineer')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('ELLISR');
        });
    });

    test.it('should show the correct levelOfCare in details', () => {
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      driver.findElement(By.id('levelOfCare')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Low');
        });
    });

    test.it('should show the correct status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Development');
        });
    });

    test.it('should show the status date in details', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            (tmpStatusDate.getMonth() + 1) + '/' +
            tmpStatusDate.getDate() + '/' +
            tmpStatusDate.getFullYear());
        });
    });

    test.it('should show the correct platforms in details', () => {
      driver.wait(until.elementLocated(By.id('platforms')));
      driver.findElement(By.id('platforms')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Test platform');
        });
    });

    test.it('should show the correct vvProcLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvProcLoc')));
      driver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://procservtest.com/procdoc1,http://procservtest.com/procdoc2');
        });
    });

    test.it('should show the correct vvResultsLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvResultsLoc')));
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct versionControl in details', () => {
      driver.wait(until.elementLocated(By.id('versionControl')));
      driver.findElement(By.id('versionControl')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Debian');
        });
    });

    test.it('should show the correct versionControlLoc in details', () => {
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('http://www.google.com');
        });
    });
  });

  test.describe('10. should show correct history after an update', () => {
    /**
     * Test the hisory section
     * Do another update
     * Then check the history table
     */

    test.it('should go to update', () => {
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('should update the same record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('desc')))
        .clear();
      driver.wait(until.elementLocated(By.id('desc')))
        .sendKeys('New Test Description2');
      driver.wait(until.elementLocated(By.id('submitBtn')))
        .click();
    });

    test.it('should show the history table in details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Details'));
    });

    test.it('should show both desc changes in the history table of details',
     function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('hist.0')));
      const input = driver.findElement(By.id('hist.0'));
      input.click();
      driver.wait(until.elementLocated(By.id('histPathName.0.0')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.id('histPathName.0.0')), 'desc'));
      driver.wait(until.elementLocated(By.id('histPathValue.0.0')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.id('histPathValue.0.0')), 'New Test Description2'));
    });
  });

  test.describe('11. should clear all optional fields', () => {
    test.it('should find new record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('swdb-update-test');
      driver.wait(until.elementLocated(By.id('versionSrch')))
        .sendKeys('Test version');
      driver.wait(until.elementLocated(By.linkText('swdb-update-test')),
        8000);
    });
    // find the created record and click update
    test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('swdb-update-test')),
        8000).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.wait(until.elementLocated(By.id('updateBtn')),
        8000).click();
    });
    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('should clear the description field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('desc')))
        .clear();
    });
    test.it('should clear the branch field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('branch'))).clear();
    });
    test.it('should clear the version field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('version'))).clear();
    });
    test.it('should clear the platforms field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('platforms'))).clear();
    });
    test.it('should clear the design desc doc field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('designDescDocLoc'))).clear();
    });
    test.it('should clear the desc doc field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('descDocLoc'))).clear();
    });
    test.it('should clear the V&V procedure location field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('rm.vvProcLoc.1')).click();
      driver.findElement(By.id('rm.vvProcLoc.0')).click();
    });
    test.it('should clear the V&V results location field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('rm.vvResultsLoc.1')).click();
      driver.findElement(By.id('rm.vvResultsLoc.0')).click();
    });
    test.it('should clear the version control location field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('versionControlLoc'))).clear();
    });
    test.it('should clear the comment field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('comment'))).clear();
    });

    test.it('Submit', () => {
      driver.findElement(By.id('submitBtn')).click();
    });
    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Details'));
    });
    test.it('should show cleared description field', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared branch field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('branch')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared version field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('version')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared platforms field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('platforms')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared design description documant location field',
     function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared description document field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared V&V procedure location field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared V&V results location field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared version control location field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
    test.it('should show cleared comment field', function(this: Mocha.ITestCallbackContext) {
      driver.findElement(By.id('comment')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('');
        });
    });
  });
});
