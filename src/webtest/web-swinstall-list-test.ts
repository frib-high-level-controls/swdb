/**
 * Test for Software Installation list.
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

const debug = Debug('swdb:web:swinstall-list-test');

const props = data.PROPS;

const browser = process.env.SELENIUM_BROWSER || 'chrome';


test.describe('Installations record tests', () => {
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

  test.it('should show search page with login button', () => {
    driver.manage().window().setPosition(200, 0);
    driver.get(props.webUrl + '#!/inst/list');
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
    driver.get(props.webUrl + '#!/inst/list');
    driver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it('should show Host column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[1]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Host');
  });

  test.it('should show name column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[2]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Name');
  });

  test.it('should show Software column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[3]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Software');
  });

  test.it('should show Area column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[4]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Area');
  });

  test.it('should show DRR column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[5]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('DRR');
  });

  test.it('should show Status column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[6]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Status');
  });

  test.it('should show Status date column names in proper order', async () => {
    const xpath = '//*[@id="instList"]/thead/tr[1]/th[7]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Status date (m/d/y)');
  });

  // find an installation record
  test.it('should find a record', () => {
    driver.get(props.webUrl + '#!/inst/list');
    driver.wait(until.elementLocated(By.id('hostSrch'))).sendKeys('host2');
    driver.wait(until.elementLocated(By.linkText('host2')));
  });
});
