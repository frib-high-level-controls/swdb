/**
 * Tests for Software 'new' page.
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


const debug = Debug('swdb:web:software-new-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';


test.describe('Software update screen tests', () => {
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


  test.describe('1. Test basic error handling', () => {
    test.it('should show search page with login button', () => {
      // prefs.setLevel(webdriver.logging.Type.BROWSER, webdriver.logging.Level.ALL);
      // options.setLoggingPrefs(prefs);
      driver.manage().window().setPosition(200, 0);
      driver.get(props.webUrl + '#!/list');
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
      driver.get(props.webUrl + '#!/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show search page with username on logout button', () => {
      driver.get(props.webUrl + '#!/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('Default status date is today', async () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      const element = await driver.findElement(By.id('statusDate'));
      const value = await element.getAttribute('value');
      const now = new Date();
      const month = ('0' + (now.getMonth() + 1)).slice(-2);
      const day = ('0' + now.getDate()).slice(-2);
      const year = now.getFullYear();
      expect(value).to.equal(`${month}/${day}/${year}`);
    });

    test.it('Clear the status date', async () => {
      await driver.findElement(By.id('statusDate')).clear();
      driver.wait(until.elementLocated(By.id('statusDate')));
    });

    test.it('Submit should fail with software name required error', () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('New - SCDB'));
      driver.wait(until.elementLocated(By.id('formError')));
      driver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Software name is required/);
        });
    });

    test.it('Set software name', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).sendKeys('testswname');
    });

    test.it('Submit should fail with software owner required error', () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('New - SCDB'));
      driver.wait(until.elementLocated(By.id('formError')));
      driver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Owner is required/);
        });
    });

    test.it('Set software owner', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      let input = driver.findElement(By.id('owner'));
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('controls');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-0"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-0"]'));
      driver.wait(until.elementIsVisible(input));
      input.click();
    });

    test.it('Submit should fail with status date required error', async () => {
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('New - SCDB'));
      driver.wait(until.elementLocated(By.id('formError')));
      const text = await driver.findElement(By.id('formError')).getText();
      expect(text).to.match(/Status date must be a date./);
    });

    test.it('Set software status date', () => {
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

      input.sendKeys('10/1/2017');
    });

    test.it('Submit should succeed showing the details screen', () => {
      driver.executeScript('scroll(0, 250);');
      driver.findElement(By.id('submitBtn')).click();
      driver.wait(until.titleIs('Details - SCDB'));
    });
  });

  test.describe('2. Add a new software record', () => {
    test.it('should show search page with username on logout button', () => {
      driver.get(props.webUrl + '#!/list');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });

    test.it('should show search page with username on logout button', () => {
      driver.get(props.webUrl + '#!/new');
      driver.wait(until.elementLocated(By.id('usrBtn')));
      driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()));
    });


    test.it('should show the requested record title', () => {
      driver.wait(until.titleIs('New - SCDB'));
    });

    test.it('Set software name', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).sendKeys('Test Record3');
    });

    test.it('Set version', () => {
      driver.wait(until.elementLocated(By.id('version')));
      const input = driver.findElement(By.id('version'));
      input.click();
      input.sendKeys('Test Version');
    });

    test.it('Set software branch', () => {
      driver.wait(until.elementLocated(By.id('branch')));
      const input = driver.findElement(By.id('branch'));
      input.click();
      input.sendKeys('Test branch');
    });

    test.it('Set software description', () => {
      driver.wait(until.elementLocated(By.id('desc')));
      const input = driver.findElement(By.id('desc'));
      input.click();
      input.sendKeys('Test description');
    });

    test.it('Set software description document', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      const input = driver.findElement(By.id('descDocLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('Set software design desciption document', () => {
      driver.wait(until.elementLocated(By.id('designDescDocLoc')));
      const input = driver.findElement(By.id('designDescDocLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('Set software owner', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      let input = driver.findElement(By.id('owner'));
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('controls');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-2-0"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-2-0"]'));
      input.click();
    });

    test.it('Set software level of care', () => {
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      const input = driver.findElement(By.id('levelOfCare'));
      input.click();
      input.sendKeys('Low');
    });

    test.it('Set software status', () => {
      driver.wait(until.elementLocated(By.id('status')));
      const input = driver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Development');
    });

    test.it('Set software status date', () => {
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

      input.sendKeys('10/1/2017');
    });


    test.it('Set software platforms', () => {
      driver.wait(until.elementLocated(By.id('platforms')));
      const input = driver.findElement(By.id('platforms'));
      input.click();
      input.sendKeys('Test platform');
    });

    test.it('Set software V&V procedure location', () => {
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


    test.it('Set software V&V results location', () => {
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

    test.it('Set software version control', () => {
      driver.wait(until.elementLocated(By.id('versionControl')));
      const input = driver.findElement(By.id('versionControl'));
      input.click();
      input.sendKeys('Git');
    });

    test.it('Set software version control location', () => {
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      const input = driver.findElement(By.id('versionControlLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('Set software engineer', () => {
      driver.wait(until.elementLocated(By.id('engineer')));
      let input = driver.findElement(By.id('engineer'));
      driver.executeScript('scroll(0, -250);');
      input.click();
      driver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
      input = driver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
      input.sendKeys('ctrleng');
      driver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-3-0"]')));
      input = driver.findElement(By.xpath('//*[@id="ui-select-choices-row-3-0"]'));
      input.click();
    });

    test.it('Submit', () => {
      driver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details record', () => {
      driver.wait(until.titleIs('Details - SCDB'));
    });
  });

  test.describe('3. Verify details', () => {
    test.it('should show the correct software name in details', () => {
      driver.wait(until.elementLocated(By.id('swName')));
      driver.findElement(By.id('swName')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test Record3');
        });
    });

    test.it('should show the correct version in details', () => {
      driver.wait(until.elementLocated(By.id('version')));
      driver.findElement(By.id('version')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test Version');
        });
    });

    test.it('should show the correct branch in details', () => {
      driver.wait(until.elementLocated(By.id('branch')));
      driver.findElement(By.id('branch')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test branch');
        });
    });

    test.it('should show the correct descption in details', () => {
      driver.wait(until.elementLocated(By.id('desc')));
      driver.findElement(By.id('desc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test description');
        });
    });

    test.it('should show the correct descption doc location in details', () => {
      driver.wait(until.elementLocated(By.id('descDocLoc')));
      driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct design descption doc location in details',
      () => {
        driver.wait(until.elementLocated(By.id('designDescDocLoc')));
        driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
          (text: string) => {
            expect(text).to.equal('http://www.google.com');
          });
      });

    test.it('should show the correct owner in details', () => {
      driver.wait(until.elementLocated(By.id('owner')));
      driver.findElement(By.id('owner')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('ISF:LAB.DIV.CONTROLS');
        });
    });

    test.it('should show the correct engineer in details', () => {
      driver.wait(until.elementLocated(By.id('engineer')));
      driver.findElement(By.id('engineer')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('CTRLENG');
        });
    });

    test.it('should show the correct level of care in details', () => {
      driver.wait(until.elementLocated(By.id('levelOfCare')));
      driver.findElement(By.id('levelOfCare')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Low');
        });
    });

    test.it('should show the correct status in details', () => {
      driver.wait(until.elementLocated(By.id('status')));
      driver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Development');
        });
    });

    test.it('should show the status date in details', () => {
      driver.wait(until.elementLocated(By.id('statusDate')));
      driver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('10/1/2017');
        });
    });

    test.it('should show the correct platforms in details', () => {
      driver.wait(until.elementLocated(By.id('platforms')));
      driver.findElement(By.id('platforms')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test platform');
        });
    });

    test.it('should show the correct vvProcLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvProcLoc')));
      driver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://procservtest.com/procdoc1,http://procservtest.com/procdoc2');
        });
    });

    test.it('should show the correct vvResultsLoc in details', () => {
      driver.wait(until.elementLocated(By.id('vvResultsLoc')));
      driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
        });
    });

    test.it('should show the correct version control location in details', () => {
      driver.wait(until.elementLocated(By.id('versionControl')));
      driver.findElement(By.id('versionControl')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Git');
        });
    });

    test.it('should show the correct version control location in details', () => {
      driver.wait(until.elementLocated(By.id('versionControlLoc')));
      driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://www.google.com');
        });
    });
  });

});
