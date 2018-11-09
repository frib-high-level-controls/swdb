/**
 * Tests for Software 'details' page.
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


const debug = Debug('swdb:web:software-details-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';



test.describe('Preload db record tests', () => {
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
    if (driver) {
      await driver.quit();
    }
  });

  after('Stop Application', async () => {
    await server.stop();
  });

  test.it('should show search page with login button', () => {
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

  test.it("should show 'Add software' button", () => {
    driver.wait(until.elementLocated(By.id('addBtn')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('addBtn')), 'Add software'));
  });

  test.it('should show a known record', async () => {
    driver.wait(until.elementLocated(By.xpath('//a[@href="#!/details/5947589458a6aa0face9a554"]')));
    const link = await driver.findElement(By.xpath('//a[@href="#!/details/5947589458a6aa0face9a554"]'));
    const linkText = await link.getText();
    expect(linkText).to.equal('BEAST');
    link.click();
  });

  test.it('should show details record title', () => {
    driver.wait(until.titleIs('Details - SCDB'));
  });

  test.it("should show 'Back' button", () => {
    driver.wait(until.elementLocated(By.id('cancelBtn')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('cancelBtn')),
      'Back to search'));
  });

  test.it("should show 'Update' button", () => {
    driver.wait(until.elementLocated(By.id('updateBtn')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('updateBtn')),
      'Update this document'));
  });

  test.it("should show 'Software' tab", () => {
    driver.wait(until.elementLocated(By.id('swTab')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('swTab')),
      'Software'));
  });

  test.it("should show 'Installations' tab", () => {
    driver.wait(until.elementLocated(By.id('instTab')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('instTab')),
      'Installations'));
  });

  test.it('should show the correct software name in details', () => {
    driver.wait(until.elementLocated(By.id('swName')));
    driver.findElement(By.id('swName')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('BEAST');
      });
  });

  test.it('should show the correct software branch in details',  () => {
    driver.wait(until.elementLocated(By.id('branch')));
    driver.findElement(By.id('branch')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('b4');
      });
  });

  test.it('should show the correct software version in details',  () => {
    driver.wait(until.elementLocated(By.id('version')));
    driver.findElement(By.id('version')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('0.2');
      });
  });

  test.it('should show the correct description in details', () => {
    driver.wait(until.elementLocated(By.id('desc')));
    driver.findElement(By.id('desc')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct description doc in details', () => {
    driver.wait(until.elementLocated(By.id('descDocLoc')));
    driver.findElement(By.id('descDocLoc')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct design description doc in details', () => {
    driver.wait(until.elementLocated(By.id('designDescDocLoc')));
    driver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct owner in details', () => {
    driver.wait(until.elementLocated(By.id('owner')));
    driver.findElement(By.id('owner')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('Berryman');
      });
  });

  test.it('should show the correct engineer in details', () => {
    driver.wait(until.elementLocated(By.id('engineer')));
    driver.findElement(By.id('engineer')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct levelOfCare in details', () => {
    driver.wait(until.elementLocated(By.id('levelOfCare')));
    driver.findElement(By.id('levelOfCare')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('Medium');
      });
  });

  test.it('should show the correct status in details', () => {
    driver.wait(until.elementLocated(By.id('status')));
    driver.findElement(By.id('status')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('Development');
      });
  });

  test.it('should show the correct statusDate in details', () => {
    driver.wait(until.elementLocated(By.id('statusDate')));
    driver.findElement(By.id('statusDate')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('7/7/1970');
      });
  });

  test.it('should show the correct platforms in details', () => {
    driver.wait(until.elementLocated(By.id('platforms')));
    driver.findElement(By.id('platforms')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct vvProcLoc in details', () => {
    driver.wait(until.elementLocated(By.id('vvProcLoc')));
    driver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct vvResultsLoc in details', () => {
    driver.wait(until.elementLocated(By.id('vvResultsLoc')));
    driver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct versionControl in details', () => {
    driver.wait(until.elementLocated(By.id('versionControl')));
    driver.findElement(By.id('versionControl')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct versionControlLoc in details', () => {
    driver.wait(until.elementLocated(By.id('versionControlLoc')));
    driver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
      (text: string) => {
        expect(text).to.equal('');
      });
  });
});
