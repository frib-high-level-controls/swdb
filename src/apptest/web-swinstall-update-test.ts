/**
 * Tests for Software Installation 'update' page.
 */
import * as util from 'util';

import {expect} from 'chai';
import * as Debug from 'debug';
import { Application } from 'express';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as test from 'selenium-webdriver/testing';
import * as SuperTest from 'supertest';

import * as server from './server';

import * as data from './data';
import * as cookies from './lib/cookies';

const debug = Debug('swdb:web:swinstall-update-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';


test.describe('Installations update screen tests', () => {
  let app: Application;
  let driver: WebDriver;
  let supertest: SuperTest.SuperTest<SuperTest.Test>;

  let tmpStatusDate: Date;
  let tmpVvApprovalDate: Date;

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

  test.describe('1. should add a new installation record', () => {
    test.it('should show search page with login button', () => {
      driver.manage().window().setPosition(200, 0);
      driver.get(props.webUrl + '#/inst/list');
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
      driver.get(props.webUrl + '#/inst/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show update page with username on logout button', () => {
      driver.get(props.webUrl + '#/inst/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });


    test.it('should show the requested installation record title', () => {
      driver.wait(until.titleIs('SWDB - New Installation'));
    });

    test.it('Set the host', () => {
      driver.wait(until.elementLocated(By.id('host')));
      const input = driver.findElement(By.id('host'));
      input.sendKeys('testHost1');
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

    test.it('Set the status', () => {
      // set status
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Ready for install');

      driver.wait(until.elementLocated(By.id('status')));
    });

    test.it('Set the status date', () => {
      // set status date
      driver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')));
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
      tmpVvApprovalDate = new Date();
    });

    test.it('Set the software', () => {
      // set software
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
    });

    test.it('set V&V results loc0 for new installation record', () => {
      driver.wait(until.elementLocated(By.id('add.vvResultsLoc')));
      const input = driver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.0')));
      const input0 = driver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('http://resultservtest.com/resultsdoc0');
    });

    test.it('set V&V results loc1 for new installation record', () => {
      driver.wait(until.elementLocated(By.id('add.vvResultsLoc')));
      const input = driver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.1')));
      const input1 = driver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://resultservtest.com/resultsdoc1');
    });

    test.it('set V&V results loc2 for new installation record', () => {
      driver.wait(until.elementLocated(By.id('add.vvResultsLoc')));
      const input = driver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      driver.wait(until.elementLocated(By.id('vvResultsLoc.2')));
      const input2 = driver.findElement(By.id('vvResultsLoc.2'));
      input2.sendKeys('http://resultservtest.com/resultdoc2');
    });
    test.it('remove V&V results loc0 for new installation record', () => {
      // remove the first entry
      driver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')));
      const input = driver.findElement(By.id('rm.vvResultsLoc.0'));
      input.click();
    });

    test.it('should show the details record', () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });
  });

  test.describe('2. should show installation details', () => {
    test.it('should show the correct installtion host in details', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
      driver.wait(until.elementLocated(By.id('host')));
      driver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost1');
        });
    });

    test.it('should show the status date in update', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            ((tmpStatusDate.getUTCMonth() + 1)) + '/' +
            (tmpStatusDate.getUTCDate()) + '/' +
            tmpStatusDate.getUTCFullYear());
        });
    });
  });

  test.describe('3. should update installation', () => {
    test.it('should go to update record', () => {
      driver.wait(until.elementLocated(By.id('updateBtn')));
      driver.findElement(By.id('updateBtn')).click();
      driver.wait(until.titleIs('SWDB - Update Installation'));
    });

    test.it('should show the correct host in update', () => {
      driver.wait(until.elementLocated(By.id('host')));
      driver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost1');
        });
    });

    test.it('should update installation host', () => {
      driver.wait(until.titleIs('SWDB - Update Installation'));
      driver.wait(until.elementLocated(By.id('host')));
      const input = driver.findElement(By.id('host'));
      input.clear();
      input.sendKeys('testHost2');
    });

    test.it('should show the correct name in update', () => {
      driver.wait(until.elementLocated(By.id('name')));
      driver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test name');
        });
    });

    test.it('should show the correct area.0 in update', () => {
      driver.wait(until.elementLocated(By.xpath('//*[@id="area.0"]/div[1]/span/span[2]/span')));
      driver.findElement(By.xpath('//*[@id="area.0"]/div[1]/span/span[2]/span')).getText().then(
        (text: string) => {
          expect(text).to.equal('ADB:CRYO');
        });
    });

    test.it('should show the correct area.1 in update', () => {
      driver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/div[1]/span/span[2]/span')));
      driver.findElement(By.xpath('//*[@id="area.1"]/div[1]/span/span[2]/span')).getText().then(
        (text: string) => {
          expect(text).to.equal('ADB:TARGET');
        });
    });

    test.it('should show the correct status in update', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for install');
        });
    });

    test.it('should show the status date in update', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            ('0' + (tmpStatusDate.getUTCMonth() + 1)).slice(-2) + '/' +
            ('0' + tmpStatusDate.getUTCDate()).slice(-2) + '/' +
            tmpStatusDate.getUTCFullYear());
        });
    });

    test.it('should show the vvApprovalDate in update', () => {
      driver.wait(until.elementLocated(By.id('vvApprovalDate')));
      driver.findElement(By.id('vvApprovalDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal(
            ('0' + (tmpVvApprovalDate.getUTCMonth() + 1)).slice(-2) + '/' +
            ('0' + tmpVvApprovalDate.getUTCDate()).slice(-2) + '/' +
            tmpVvApprovalDate.getUTCFullYear());
        });
    });

    test.it('submit update form', () => {
      driver.wait(until.elementLocated(By.id('submitBtn')));
      driver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('4. should show updated installation details', () => {
    test.it('should show the details record', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });

    test.it('should show the correct installtion host in details', () => {
      driver.wait(until.elementLocated(By.id('host')));
      driver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost2');
        });
    });

    test.it('should show the correct installtion name in details', () => {
      driver.wait(until.elementLocated(By.id('name')));
      driver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test name');
        });
    });

    test.it('should show the correct installtion software in details', () => {
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
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for install');
        });
    });

    test.it('should show the correct installtion V&V results in details', () => {
      driver.wait(until.elementLocated(By.id('vvResultsLoc')));
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
        });
    });

    test.it('should show changes in the history table of details', () => {
      // *[@id="histTable"]/tbody/tr[2]/td[2] shold be "New Test Description2"
      driver.wait(until.elementLocated(By.id('hist.0')));
      const input = driver.findElement(By.id('hist.0'));
      input.click();
      driver.wait(until.elementLocated(By.id('histPathName.0.0')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.id('histPathName.0.0')),
        'host'));
      driver.wait(until.elementLocated(By.id('histPathValue.0.0')));
      driver.wait(until.elementTextContains(driver.findElement(
        By.id('histPathValue.0.0')),
        'testHost2'));
    });
  });

  test.describe('5. should update installation clearing optional fields', () => {
    test.it('should go to update record', () => {
      driver.wait(until.elementLocated(By.id('updateBtn')));
      driver.findElement(By.id('updateBtn')).click();
      driver.wait(until.titleIs('SWDB - Update Installation'));
    });

    test.it('clear name field', () => {
      driver.wait(until.elementLocated(By.id('name')));
      const input = driver.findElement(By.id('name'));
      input.clear();
    });

    test.it('clear V&V results fields', () => {
      driver.wait(until.elementLocated(By.id('rm.vvResultsLoc.1')));
      let input = driver.findElement(By.id('rm.vvResultsLoc.1'));
      input.click();
      driver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')));
      input = driver.findElement(By.id('rm.vvResultsLoc.0'));
      input.click();
    });

    test.it('clear V&V date', () => {
      driver.wait(until.elementLocated(By.id('vvApprovalDate')));
      const input = driver.findElement(By.id('vvApprovalDate'));
      input.clear();
    });

    test.it('submit update form', () => {
      driver.wait(until.elementLocated(By.id('submitBtn')));
      driver.findElement(By.id('submitBtn')).click();
    });
  });

  test.describe('6. should show updated installation details', () => {
    test.it('should show the details record', () => {
      driver.wait(until.titleIs('SWDB - Installation Details'));
    });

    test.it('should show the correct installtion host in details', () => {
      driver.wait(until.elementLocated(By.id('host')));
      driver.findElement(By.id('host')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('testHost2');
        });
    });

    test.it('should show the correct installtion name in details', () => {
      driver.wait(until.elementLocated(By.id('name')));
      driver.findElement(By.id('name')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion software in details', () => {
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
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Ready for install');
        });
    });

    test.it('should show the correct installtion V&V results in details', () => {
      driver.wait(until.elementLocated(By.id('vvResultsLoc')));
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });

    test.it('should show the correct installtion V&V results date in details', () => {
      driver.wait(until.elementLocated(By.id('vvApprovalDate')));
      driver.findElement(By.id('vvApprovalDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('');
        });
    });
  });
});
