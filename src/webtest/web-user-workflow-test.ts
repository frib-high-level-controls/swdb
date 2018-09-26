/**
 * Test flow built around a specified set of FRIB data:
 * https://docs.google.com/document/d/17mlTs5Ccqjw0h-_fzi4Gd_jIESnvxBRbNhjEcxK6kvs
 */
import * as util from 'util';

import {expect} from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import * as test from 'selenium-webdriver/testing';
import * as SuperTest from 'supertest';

import * as server from './server';

import * as data from '../apptest/data';
import * as cookies from '../apptest/lib/cookies';

const debug = Debug('swdb:web:user-workflow-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';


test.describe('User flow2 tests', () => {
  let app: Application;
  let driver: WebDriver;
  let supertest: SuperTest.SuperTest<SuperTest.Test>;

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

  /**
   * 1. Make a new SW record
   */
  test.it('should show search page with login button', function(this: Mocha.ITestCallbackContext) {
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

  test.it('should show the requested sw record title', () => {
    driver.wait(until.titleIs('SWDB - New'));
  });

  test.describe('1. Add initial software record', () => {
    test.it('Add new sw record - set name', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).sendKeys('EXTA IOC');
    });

    test.it('Add new sw record - set owner', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('owner')));
      let input = driver.findElement(By.id('owner'));
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('ISF:LAB.DIV.CONTROLS.HLC');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-0"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-0"]'));
      input.click();
    });

    test.it('Set software status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')));
      let input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')));
      input = driver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      driver.wait(until.elementLocated(By.id('statusDate')));
      input = driver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('06/13/2018');
    });

    test.it('Submit', () => {
      driver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('2. Update the new software record', () => {
    /**
     * 2. Update the new software record
     */

    test.it('should show the sw details record', function(this: Mocha.ITestCallbackContext) {
      // check result
      driver.wait(until.titleIs('SWDB - Details'));
    });

    test.it('should show the correct software name in details', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('EXTA IOC');
        });
    });

    test.it('should show the correct software owner in details', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.findElement(By.id('owner')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('ISF:LAB.DIV.CONTROLS.HLC');
        });
    });

    test.it('should show the correct software status date in details', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('6/13/2018');
        });
    });

    test.it('update this record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('should show the sw update title', () => {
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('Update sw record - set version', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).sendKeys('2.3.5');
    });

    test.it('Update sw record - set description', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).sendKeys('New Input/Output controller for Extreme Aquisition');
    });

    test.it('Update sw record - set desc doc', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      const input = driver.findElement(By.id('descDocLoc'));
      input.click();
      input.sendKeys('FRIB-T10500-CM-000228-001');
    });

    test.it('Update sw record - set design desc doc', function(this: Mocha.ITestCallbackContext) {
      // set design description document
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      const input = driver.findElement(By.id('designDescDocLoc'));
      input.click();
      input.sendKeys('FRIB-T10500-ED-00422-002');
    });

    test.it('Update sw record - set level of care', function(this: Mocha.ITestCallbackContext) {
      // set level of care
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      const input = driver.findElement(By.id('levelOfCare'));
      input.click();
      input.sendKeys('Medium');
    });

    test.it('Update sw record - set platforms', function(this: Mocha.ITestCallbackContext) {
      // set platforms
      driver.wait(until.elementLocated(By.id('platforms')));
      const input = driver.findElement(By.id('platforms'));
      input.click();
      input.sendKeys('Linux (x86_64, arm64)');
    });

    test.it('Update sw record - set vvProcLoc', function(this: Mocha.ITestCallbackContext) {
      // set vvProcLoc
      driver.wait(until.elementLocated(By.id('add.vvProcLoc')));
      const input = driver.findElement(By.id('add.vvProcLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvProcLoc.0')));
      const input0 = driver.findElement(By.id('vvProcLoc.0'));
      input0.sendKeys('FRIB-T10500-ED-00422-002');
      input.click();
      driver.wait(until.elementLocated(By.id('vvProcLoc.1')));
      const input1 = driver.findElement(By.id('vvProcLoc.1'));
      input1.sendKeys('http://example.com/docs/FRIB-T10500-ED-00422-002.pdf');
    });

    test.it('Update sw record - set version control', function(this: Mocha.ITestCallbackContext) {
      // set version control
      driver.wait(until.elementLocated(By.id('versionControl')));
      const input = driver.findElement(By.id('versionControl'));
      input.click();
      input.sendKeys('Git');
    });

    test.it('Update sw record - set version control loc', () => {
      // set version control location
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      const input = driver.findElement(By.id('versionControlLoc'));
      input.click();
      input.sendKeys('http://git.example.com/repo/exta');
    });

    test.it('Update sw record - set comment', () => {
      // set version control location
      driver.wait(until.elementLocated(By.id('comment')));
      const input = driver.findElement(By.id('comment'));
      input.click();
      input.sendKeys('This software record is for testing purposes only!');
    });


    test.it('Update sw record - set status Development', function(this: Mocha.ITestCallbackContext) {
      // set status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');
      input.sendKeys(Key.ENTER);
    });
  });

  test.describe('3. SW update version & branch fields disable on Ready for install', () => {
    /**
     * 3. On the update screen, check that the branch and version fields
     * are disabled if the status is Ready for install.
     */
    test.it('Update sw record - version field disabled in Ready for Install',
     function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('version')));
      const input = driver.findElement(By.id('version'));
      driver.wait(until.elementIsDisabled(input));
    });

    test.it('Update sw record - branch field disabled in Ready for Install',
     function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('branch')));
      const input = driver.findElement(By.id('branch'));
      driver.wait(until.elementIsDisabled(input));
    });

    test.it('Update sw record - set engineer', async function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('engineer')));
      let input = driver.findElement(By.id('engineer'));
      // driver.executeScript('scroll(0, -250);');
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
      input.sendKeys('CTRLENG');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-3-0"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-3-0"]'));
      input.click();
    });

    test.it('Submit', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the sw details record', function(this: Mocha.ITestCallbackContext) {
      // check result
      driver.wait(until.titleIs('SWDB - Details'));
    });
  });

  test.describe('4. Make a new installation record', () => {
    /**
     * 4. Make a new installation record
     */
    test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/inst/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show the new installation page title', () => {
      driver.wait(until.titleIs('SWDB - New Installation'));
    });
    test.it('Add new inst record - set host', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('host')));
      const input = driver.findElement(By.id('host'));
      input.sendKeys('vmachine01');
    });

    test.it('Add new inst record - set software', function(this: Mocha.ITestCallbackContext) {
      // set software
      driver.wait(until.elementLocated(By.id('software')));
      let searchInput = driver.findElement(By.id('software'));
      searchInput.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = driver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('EXTA IOC');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-4-0"]/span')));
    });

    test.it('Add new inst record - click row', function(this: Mocha.ITestCallbackContext) {
      const input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-4-0"]/span'));
      input.click();
    });

    test.it('Add new inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')));
      let input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')));
      input = driver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      driver.wait(until.elementLocated(By.id('statusDate')));
      input = driver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('06/13/2018');
    });

    test.it('Add new inst record - set area 0', function(this: any) {
      // set area
      // add controls room, operator area, nscl control room
      // then delete the controls room
      driver.wait(until.elementLocated(By.id('add.area')));
      const input = driver.findElement(By.id('add.area'));
      input.click();
      driver.wait(until.elementLocated(By.id('area.0')));
      const input0 = driver.findElement(By.id('area.0'));
      input0.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="area.0"]/input[1]')));
      const input0b = driver.findElement(By.xpath('//*[@id="area.0"]/input[1]'));
      input0b.sendKeys('front');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-5-0"]/span')));
      const inputZero = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-5-0"]/span'));
      inputZero.click();
    });

    test.it('Add new inst record - set area 1', function(this: any) {
      driver.wait(until.elementLocated(By.id('add.area')));
      const input = driver.findElement(By.id('add.area'));
      input.click();
      driver.wait(until.elementLocated(By.id('area.1')));
      const input1 = driver.findElement(By.id('area.1'));
      input1.click();

      driver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/input[1]')));
      const input1b = driver.findElement(By.xpath('//*[@id="area.1"]/input[1]'));
      input1b.sendKeys('cryo');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-6-0"]/span')));
      const inputOne = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-6-0"]/span'));
      inputOne.click();
    });

    test.it('Add new record - set drr', () => {
      // set drrs
      driver.wait(until.elementLocated(By.id('drrs')));
      const input = driver.findElement(By.id('drrs'));
      input.click();
      input.sendKeys('DDR05');
    });

    test.it('Add new record - set status', () => {
      // set the status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');

      driver.wait(until.elementLocated(By.id('status')));
    });

    test.it('Submit', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the inst details record', function(this: Mocha.ITestCallbackContext) {
      // check result
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });
  });

  test.describe('5. Update the installation record - Ready for verification status', () => {
    /**
     * 5. Update the installation record - Ready for verification status
     */
    test.it('update this inst record', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('Update inst record - set name', () => {
      // set drrs
      driver.wait(until.elementLocated(By.id('name')));
      const input = driver.findElement(By.id('name'));
      input.click();
      input.sendKeys('FE EXTA IOC');
    });

    test.it('Update inst record - set status', () => {
      // set the status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for verification');

    });

    test.it('Update inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')));
      let input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')));
      input = driver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      driver.wait(until.elementLocated(By.id('statusDate')));
      input = driver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('06/14/2018');
    });

    test.it('Submit "Ready for verification" update', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the inst details record', function(this: Mocha.ITestCallbackContext) {
      // check result
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });
  });

  test.describe('6. Update the installation record - Ready for beam status', () => {
    /**
     * 6. Update the installation record - Ready for beam status
     */
    test.it('update this inst record 2', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('Update2 inst record - set status', () => {
      // set the status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for beam');

    });

    test.it('Update inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/15/2018');
    });

    test.it('Update inst record - set V&V apprval date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('vvApprovalDate')));
      const input = driver.findElement(By.id('vvApprovalDate'));
      input.clear();
      input.sendKeys('06/15/2018');
    });

    test.it('Update inst record - set vvResultsLoc', function(this: Mocha.ITestCallbackContext) {
      // set vvResultsLoc
      driver.wait(until.elementLocated(By.id('add.vvResultsLoc')));
      const input = driver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.0')));
      const input0 = driver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('FRIB-T10384-TP-000942-001');
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.1')));
      const input1 = driver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://example.com/docs/FRIB-T10384-TP-00942-001.pdf');
    });

    test.it('Submit "Ready for beam" update', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the inst details record', function(this: Mocha.ITestCallbackContext) {
      // check result
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });
  });

  test.describe('7. Update software to Development status', () => {
    /**
     * 7. Update software to Development status
     */
    test.it('should find the sw record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('EXTA IOC');
      driver.wait(until.elementLocated(By.linkText('EXTA IOC')));
    });

    // find the created record and click update
    test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('EXTA IOC'))).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('Update2 inst record - set status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Development');
    });

    test.it('Update inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/15/2018');
    });

    test.it('Submit "Development" update', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the correct error', () => {
      driver.wait(until.elementLocated(By.id('formError')));
      driver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Software state cannot change while there are active installations/);
        });
    });
  });


  test.describe('8. Attempt to bump the version to the same as existing version number', () => {
    /**
     * 8. Attempt to bump the version to the same as existing version number
     */
    test.it('should find the sw record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('EXTA IOC');
      driver.wait(until.elementLocated(By.linkText('EXTA IOC')));
    });

    // find the created record and click update
    test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('EXTA IOC'))).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.wait(until.elementLocated(By.id('bumpVerBtn'))).click();
    });

    test.it('Should go to a prepopulated software update page', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - New'));
    });
  });

  test.describe('9. Attempt to update set to duplicate version', () => {
  /**
   * 9. Attempt to update set to duplicate version
   */

  // test.it('Update sw record - set version', function(this: Mocha.ITestCallbackContext) {
  //   this.timeout(5000);
  //   driver.wait(until.elementLocated(By.id('version')));
  //   driver.findElement(By.id('version')).sendKeys('2.3.5');
  // });

  // test.it('Set software status date', function(this: Mocha.ITestCallbackContext) {
  //   this.timeout(5000);
  //   driver.wait(until.elementLocated(By.id('statusDate')));
  //   let input = driver.findElement(By.id('statusDate'));
  //   input.clear();
  //   input.sendKeys('06/16/2018');
  // });

  // test.it('Submit "bump software version" request',  () => {
  //   driver.findElement(By.id('submitBtn')).click();
  // });

  // test.it('should show the correct error', () => {
  //   driver.wait(until.titleIs('SWDB - Update'), 2000);
  //   driver.wait(until.elementLocated(By.id('formError')));
  //   driver.findElement(By.id('formError')).getText().then(
  //     (text) => {
  //       expect(text).to.match(/duplicate key error/);
  //     });
  // });
  });

  test.describe('10. Try to update verision to unique number', () => {
    /**
     * 10. Try to update verision to unique number
     */
    test.it('Update sw record - set version', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).sendKeys('2.3.6');
    });

    test.it('Submit "bump software version" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      driver.wait(until.titleIs('SWDB - Details'));
    });
  });

  test.describe('11. Update status of bumped version to Ready for install', () => {
    /**
     * 11. Update status of bumped version to Ready for install
     */
    test.it('should find the sw record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('EXTA IOC');
      driver.wait(until.elementLocated(By.id('versionSrch')))
        .sendKeys('2.3.6');
      driver.wait(until.elementLocated(By.linkText('EXTA IOC')));
    });

    // find the created record and click update
    test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('EXTA IOC'))).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('Set software status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/18/2018');
    });

    test.it('Update software record - set status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');
    });

    test.it('Submit "update software version" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('12. Update installation status as Ready for install', () => {
    /**
     * 12. Update installation status as Ready for install
     */

    test.it('should find the installation record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/inst/list');
      driver.wait(until.elementLocated(By.id('hostSrch'))).sendKeys('vmachine01');
      driver.wait(until.elementLocated(By.linkText('vmachine01'))).click();
    });

    test.it('should show installation record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update Installation'));
    });

    test.it('Update inst record - set status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');
    });

    test.it('Update inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/20/2018');
    });

    test.it('Update inst record - set vvResultsLoc', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('rm.vvResultsLoc.1')));
      const input1 = driver.findElement(By.id('rm.vvResultsLoc.1'));
      input1.click();
      driver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')));
      const input0 = driver.findElement(By.id('rm.vvResultsLoc.0'));
      input0.click();
    });

    test.it('Update inst record - software field should be disabled',
      function(this: Mocha.ITestCallbackContext) {
        driver.wait(until.elementLocated(By.id('software')));
        const input = driver.findElement(By.id('software'));
        input.getAttribute('disabled').then(
          (text) => {
            expect(text).to.equal('true');
          });
      });

    test.it('Submit "update installation version" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });

    test.it('should show the correct sw field in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('Ready for install');
        });
    });
  });

  test.describe('13. Update installation to sw field "EXTA IOC//2.3.6"', () => {
    /**
     * 13. Update installation status as Ready for install
     */

    test.it('should show installation record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update Installation'));
    });

    test.it('Add new inst record - set software', async function(this: Mocha.ITestCallbackContext) {
      // set software

      driver.wait(until.elementLocated(By.id('software')));
      let searchInput = driver.findElement(By.id('software'));
      searchInput.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = driver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('2.3.6');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-22-0"]/span'))).click();

    });

    test.it('Submit "update installation version" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });

    test.it('should show the correct sw field in details', () => {
      driver.wait(until.elementLocated(By.id('software')));
      driver.findElement(By.id('software')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('EXTA IOC / / 2.3.6');
        });
    });
  });

  test.describe('14. Update installation status as Ready for verification', () => {
    /**
     * 14. Update installation status as Ready for verification
     */
    test.it('should show installation record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('Update inst record - set status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for verification');
    });

    test.it('Update inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/21/2018');
    });

    test.it('Submit "update installation version" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });
  });

  test.describe('15. Update installation status as Ready for beam', () => {
    test.it('should show installation record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('Update inst record - set status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for beam');
    });

    test.it('Update inst record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/22/2018');
    });

    test.it('Update inst record - set V&V apprval date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('vvApprovalDate')));
      const input = driver.findElement(By.id('vvApprovalDate'));
      input.clear();
      input.sendKeys('06/22/2018');
    });

    test.it('Update inst record - set vvResultsLoc', function(this: Mocha.ITestCallbackContext) {
      // set vvResultsLoc
      driver.wait(until.elementLocated(By.id('add.vvResultsLoc')));
      const input = driver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.0')));
      const input0 = driver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('FRIB-T10384-TP-000942-002');
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.1')));
      const input1 = driver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://example.com/docs/FRIB-T10384-TP-00942-002.pdf');
    });

    test.it('Submit "update installation version" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });
  });

  test.describe('16. Update software status as Deprecated', () => {
    test.it('should find the sw record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('EXTA IOC');
      driver.wait(until.elementLocated(By.id('versionSrch')))
        .sendKeys('2.3.5');
      driver.wait(until.elementLocated(By.linkText('EXTA IOC')));
    });

    // find the created record and click update
    test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('EXTA IOC'))).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
    });

    test.it('should show the update title', () => {
      driver.wait(until.titleIs('SWDB - Update'));
    });

    test.it('Update sw record - set status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('DEPRECATED');
    });

    test.it('Update sw record - set status date', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const input = driver.findElement(By.id('statusDate'));
      input.clear();
      input.sendKeys('06/22/2018');
    });

    test.it('Submit "update sw status" request', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details title', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.titleIs('SWDB - Details'));
    });

    test.it('should show the correct sw status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('DEPRECATED');
        });
    });

    test.it('should show the correct sw status date in details', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text) => {
          expect(text).to.equal('6/22/2018');
        });
    });
  });

  test.describe('Cancel from new sw goes back to list', () => {
    // test cancel from new sw record foes back to the mail search screen
    test.it('should show new page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show the new sw record title and click cancel', () => {
      driver.wait(until.titleIs('SWDB - New'));
      driver.wait(until.elementLocated(By.id('cancelBtn')));
      driver.findElement(By.id('cancelBtn')).click();
    });

    test.it('should show list page', () => {
      driver.wait(until.titleIs('SWDB - List'));
    });
  });

  let id: string | undefined;
  test.describe('Cancel from sw update goes back to details', () => {
    // Test cancel from sw update goes back to the appropriate detauils screen
    // find the created record
    test.it('should find a record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('swNameSrch')))
        .sendKeys('EXTA IOC');
      driver.wait(until.elementLocated(By.id('versionSrch')))
        .sendKeys('2.3.5');
      driver.wait(until.elementLocated(By.linkText('EXTA IOC')));
    });

    // find the created record and click update-cancel and back to details
    test.it('should show record details after cancel update', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('EXTA IOC'))).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.getCurrentUrl().then((currUrl) => {
        id = currUrl.split('/').pop();
      });
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
      driver.wait(until.titleIs('SWDB - Update'));
      driver.wait(until.elementLocated(By.id('cancelBtn'))).click();
      driver.wait(until.titleIs('SWDB - Details'));
      driver.getCurrentUrl().then((currUrl) => {
        const newid = currUrl.split('/').pop();
        expect(newid).to.equal(id);
      });
    });
  });

  test.describe('Cancel from new installation goes back to list', () => {
    // test cancel from new sw record foes back to the mail search screen
    test.it('should show new installation page with username on logout button',
      function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/inst/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show the new sw record title and click cancel', () => {
      driver.wait(until.titleIs('SWDB - New Installation'));
      driver.wait(until.elementLocated(By.id('cancelBtn')));
      driver.findElement(By.id('cancelBtn')).click();
    });

    test.it('should show list page', () => {
      driver.wait(until.titleIs('SWDB - Installations List'));
    });
  });

  test.describe('Cancel from installation update goes back to details', () => {
    // Test cancel from sw update goes back to the appropriate detauils screen
    // find the created record
    test.it('should find installation record', function(this: Mocha.ITestCallbackContext) {
      driver.get(props.webUrl + '#/inst/list');
      driver.wait(until.elementLocated(By.id('hostSrch')))
        .sendKeys('vmachine01');
    });

    // find the created record and click update-cancel and back to details
    test.it('should show record details after cancel update', function(this: Mocha.ITestCallbackContext) {
      driver.wait(until.elementLocated(By.linkText('vmachine01'))).click();
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.getCurrentUrl().then((currUrl) => {
        id = currUrl.split('/').pop();
      });
      driver.wait(until.elementLocated(By.id('updateBtn'))).click();
      driver.wait(until.titleIs('SWDB - Update Installation'));
      driver.wait(until.elementLocated(By.id('cancelBtn'))).click();
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.getCurrentUrl().then((currUrl) => {
        const newid = currUrl.split('/').pop();
        expect(newid).to.equal(id);
      });
    });
  });
});
