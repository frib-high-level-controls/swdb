/**
 * Tests for Software Installation 'details' page.
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


const debug = Debug('swdb:web:swinstall-details-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';

test.describe('Installations detail screen tests', () => {
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

  test.it('should show search page with login button', async () =>  {
    await driver.manage().window().setPosition(200, 0);
    await driver.get(props.webUrl + '#!/inst/list');
    await driver.wait(until.elementLocated(By.id('usrBtn')));
    await driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')), 'Log in'));
  });

  test.it('login as test user by setting session cookie and refreshing', async () => {
    const res = await supertest.get('/login')
      .auth(props.test.username, props.test.password).expect(302);
    const sid = cookies.parseCookie(res, 'connect.sid');
    debug('Set WebDriver cookie: %s', util.inspect(sid));
    await driver.manage().addCookie(sid);
    await driver.navigate().refresh();
  });

  test.it('should show search page with username on logout button', async () => {
    await driver.get(props.webUrl + '#!/inst/list');
    await driver.wait(until.elementLocated(By.id('usrBtn')));
    await driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()));
  });

  test.it('should find a record', async () => {
    await driver.get(props.webUrl + '#!/inst/list');
    await driver.wait(until.elementLocated(By.id('hostSrch'))).sendKeys('host2');
    await driver.wait(until.elementLocated(By.linkText('host2')));
  });

  test.it('should show the requested installation record title', async () => {
    await driver.findElement(By.linkText('host2')).click();
    await driver.wait(until.titleIs('Installation Details - SCDB'));
  });

  test.it('should show the requested installation record user button', async () => {
    await driver.wait(until.elementLocated(By.id('usrBtn')));
    await driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()));
  });

  test.it('should show the requested installation record host field', async () => {
    await driver.wait(until.elementLocated(By.id('host')));
    const result = await driver.findElement(By.id('host')).getAttribute('value');
    expect(result).to.match(/host2/);
  });

  test.it('should show the requested installation record name field', async () => {
    await driver.wait(until.elementLocated(By.id('name')));
    const result = await driver.findElement(By.id('name')).getAttribute('value');
    expect(result).to.equal('Installation name2');
  });

  test.it('should show the requested installation record software field', async () => {
    await driver.wait(until.elementLocated(By.id('software')));
    const result = await driver.findElement(By.id('software')).getAttribute('value');
    expect(result).to.equal('BEAST / b4 / 0.2');
  });

  test.it('should show the requested installation record area field', async () => {
    await driver.wait(until.elementLocated(By.id('area')));
    const result = await driver.findElement(By.id('area')).getAttribute('value');
    expect(result).to.match(/LS1/);
  });

  test.it('should show the requested installation record status field', async () => {
    await driver.wait(until.elementLocated(By.id('status')));
    const result = await driver.findElement(By.id('status')).getAttribute('value');
    expect(result).to.match(/Ready for install/);
  });

  test.it('should show the requested installation record status date field', async () => {
    await driver.wait(until.elementLocated(By.id('statusDate')));
    const result = await driver.findElement(By.id('statusDate')).getAttribute('value');
    expect(result).to.match(/9\/21\/2016/);
  });

  test.it('should show the requested installation record vvResults field', async () => {
    await driver.wait(until.elementLocated(By.id('vvResultsLoc')));
    const result = await driver.findElement(By.id('vvResultsLoc')).getAttribute('value');
    expect(result).to.match(/vvResultsLoc2/);
  });

  test.it('should show the requested installation record VV approval date field', async () => {
    await driver.wait(until.elementLocated(By.id('vvApprovalDate')));
    const result = await driver.findElement(By.id('vvApprovalDate')).getAttribute('value');
    expect(result).to.match(/9\/22\/2016/);
  });

  test.it('should show the requested installation record drrs field', async () => {
    await driver.wait(until.elementLocated(By.id('drrs')));
    const result = await driver.findElement(By.id('drrs')).getAttribute('value');
    expect(result).to.match(/^$/);
  });
});
