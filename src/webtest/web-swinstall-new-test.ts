/**
 * Tests for Software Installation 'new' page.
 */
import * as util from 'util';

import {expect} from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as test from 'selenium-webdriver/testing';
import * as SuperTest from 'supertest';

import * as server from './server';

import * as data from '../apptest/data';
import * as cookies from '../apptest/lib/cookies';


const debug = Debug('swdb:web:swinstall-new-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';


test.describe('Installations add screen tests', () => {
  let app: Application;
  let driver: WebDriver;
  let supertest: SuperTest.SuperTest<SuperTest.Test>;

  let tmpStatusDate: Date;
  let tmpStatusDate2: Date;

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
    if (driver) {
      await driver.quit();
    }
  });

  after('Stop Application', async () => {
    await server.stop();
  });

  test.describe('1. Test basic error handling', () => {
    test.it('should show search page with login button', () => {
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

    test.it('should show search page with username on logout button', () => {
      driver.get(props.webUrl + '#/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show search page with username on logout button', () => {
      driver.get(props.webUrl + '#/inst/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('Submit should fail', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should stay on the new form', () => {
      driver.wait(until.titleIs('New Installation - SCDB'));
    });

    test.it('Set installation host', () => {
      driver.wait(until.elementLocated(By.id('host')));
      const input = driver.findElement(By.id('host'));
      input.sendKeys('testHost0');
    });

    test.it('Add new record - set status date', () => {
      // set status date
      driver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')));
      let input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')));
      input = driver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
    });

    test.it('Submit should fail with area required error', () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('New Installation - SCDB'));
      driver.wait(until.elementLocated(By.id('formError')));
      driver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Areas is required\./);
        });
    });

    test.it('Add new record - set area 0', () => {
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
      input0b.sendKeys('front\n');

      driver.wait(until.elementTextContains(input0, 'ADB:FRONT_END'));
    });

    test.it('Submit should fail with software name required error', () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('New Installation - SCDB'));
      driver.wait(until.elementLocated(By.id('formError')));
      driver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Software reference is required/);
        });
    });

    test.it('set software', async () => {
      driver.wait(until.elementLocated(By.id('software')));
      let searchInput = driver.findElement(By.id('software'));
      searchInput.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = driver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('BEAST');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-0"]/span')));
      const input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-0"]/span'));
      input.click();
      driver.wait(until.elementTextContains(driver.findElement(
        By.id('software')),
        'BEAST/b12/0.2'));
      driver.wait(until.elementTextContains(driver.findElement(
        By.id('software')),
        'BEAST/b12/0.2'));
    });

    test.it('Submit should and go to Installation Details', () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('Installation Details - SCDB'));
    });
  });

  test.describe('2. Add new installation', () => {
    test.it('should show search page with username on logout button', () => {
      driver.get(props.webUrl + '#/inst/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show new page with username on logout button', () => {
      driver.get(props.webUrl + '#/inst/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });


    test.it('should show the requested installation record title', () => {
      driver.wait(until.titleIs('New Installation - SCDB'));
    });

    test.it('Add new record - set host', () => {
      driver.wait(until.elementLocated(By.id('host')));
      const input = driver.findElement(By.id('host'));
      input.sendKeys('testHost1');
    });

    test.it('Add new record - set software', async () => {
      driver.wait(until.elementLocated(By.id('software')));
      let searchInput = driver.findElement(By.id('software'));
      searchInput.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
      searchInput = driver.findElement(By.xpath('//*[@id="software"]/input[1]'));
      searchInput.sendKeys('BEAST');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-2-0"]/span')));
      const input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-2-0"]/span'));
      input.click();
      driver.wait(until.elementTextContains(driver.findElement(By.id('software')), 'BEAST/b12/0.2'));
      driver.wait(until.elementTextContains(driver.findElement(By.id('software')), 'BEAST/b12/0.2'));
    });

    test.it('Add new record - set name', () => {
      // set name
      driver.wait(until.elementLocated(By.id('name')));
      const input = driver.findElement(By.id('name'));
      input.click();
      input.sendKeys('Test name');
    });

    test.it('Add new record - set area 0', () => {
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
      input0b.sendKeys('front\n');

      driver.wait(until.elementTextContains(input0, 'ADB:FRONT_END'));
    });

    test.it('Add new record - set area 1', () => {
      driver.wait(until.elementLocated(By.id('add.area')));
      const input = driver.findElement(By.id('add.area'));
      input.click();
      driver.wait(until.elementLocated(By.id('area.1')));
      const input1 = driver.findElement(By.id('area.1'));
      input1.click();

      driver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/input[1]')));
      const input1b = driver.findElement(By.xpath('//*[@id="area.1"]/input[1]'));
      input1b.sendKeys('cryo\n');

      driver.wait(until.elementTextContains(input1, 'ADB:CRYO'));
    });

    test.it('Add new record - set area 2', () => {
      driver.wait(until.elementLocated(By.id('add.area')));
      const input = driver.findElement(By.id('add.area'));
      input.click();
      driver.wait(until.elementLocated(By.id('area.2')));
      const input2 = driver.findElement(By.id('area.2'));
      input2.click();

      driver.wait(until.elementLocated(By.xpath('//*[@id="area.2"]/input[1]')));
      const input2b = driver.findElement(By.xpath('//*[@id="area.2"]/input[1]'));
      input2b.sendKeys('target\n');

      driver.wait(until.elementTextContains(input2, 'ADB:TARGET'));
    });

    test.it('Add new record - remove area 0', () => {
      driver.wait(until.elementLocated(By.id('rm.area.0')));
      const input = driver.findElement(By.id('rm.area.0'));
      input.click();
    });

    test.it('Add new record - set drr', () => {
      // set drrs
      driver.wait(until.elementLocated(By.id('drrs')));
      const input = driver.findElement(By.id('drrs'));
      input.click();
      input.sendKeys('TestDRR');
    });

    test.it('Add new record - set status', () => {
      // set the status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for beam');

      driver.wait(until.elementLocated(By.id('status')));
    });

    test.it('Add new record - set status date', () => {
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

    test.it('Add new record - set V&V Approval date', () => {
      driver.wait(until.elementLocated(By.xpath('//*[@id="vvApprovalDate-group"]/div/p/span/button/i')));
      let input = driver.findElement(By.xpath('//*[@id="vvApprovalDate-group"]/div/p/span/button/i'));
      input.click();
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="vvApprovalDate-group"]/div/p/div/ul/li[2]/span/button[1]')));
      input = driver.findElement(By.xpath('//*[@id="vvApprovalDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      tmpStatusDate2 = new Date();
    });

    test.it('Add new record - set vvResultsLoc', () => {
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

      driver.findElement(By.id('submitBtn')).click();
    });


    test.it('should show the details record', () => {
      driver.wait(until.titleIs('Installation Details - SCDB'));
    });
  });

  test.describe('3. Show new installation details', () => {
    test.it('should show the correct installtion host in details', () => {
      driver.wait(until.elementLocated(By.id('host')));
      driver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost1');
        });
    });

    test.it('should show the correct installation name in details', () => {
      driver.wait(until.elementLocated(By.id('name')));
      driver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test name');
        });
    });

    test.it('should show the correct installation software in details', () => {
      driver.wait(until.elementLocated(By.id('software')));
      driver.findElement(By.id('software')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('BEAST / b12 / 0.2');
        });
    });

    test.it('should show the correct installtion area in details', () => {
      driver.wait(until.elementLocated(By.id('area')));
      driver.findElement(By.id('area')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('ADB:CRYO,ADB:TARGET');
        });
    });

    test.it('should show the correct installtion DRR in details', () => {
      driver.wait(until.elementLocated(By.id('drrs')));
      driver.findElement(By.id('drrs')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('TestDRR');
        });
    });

    test.it('should show the correct installtion status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for beam');
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

    test.it('should show the correct vvResultsLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvResultsLoc')));
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
        });
    });

    test.it('should show the V&V approval date in details', () => {
      driver.wait(until.elementLocated(By.id('vvApprovalDate')));
      driver.findElement(By.id('vvApprovalDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            (tmpStatusDate2.getMonth() + 1) + '/' +
            tmpStatusDate2.getDate() + '/' +
            tmpStatusDate2.getFullYear());
        });
    });
  });
});
