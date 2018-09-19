/**
 * Test for Software list.
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

const debug = Debug('swdb:web:software-list-tests');

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
    driver.get(props.webUrl + '#/list');
    driver.wait(until.elementLocated(By.id('usrBtn')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('usrBtn')),
      'Log in'));
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

  test.it('should show title', () => {
    driver.wait(until.titleIs('SWDB - List'));
  });

  test.it("should show 'Add software' button", () => {
    driver.wait(until.elementLocated(By.id('addBtn')));
    driver.wait(until.elementTextContains(driver.findElement(By.id('addBtn')),
      'Add software'));
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

  test.it('should show SW name columns names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[1]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Software name');
  });

  test.it('should show Status column names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[2]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Branch');
  });

  test.it('should show Version column names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[3]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Version');
  });

  test.it('should show Owner column names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[4]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Owner');
  });

  test.it('should show Engineer column names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[5]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Engineer');
  });

  test.it('should show Status column names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[6]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Status');
  });

  test.it('should show Status date column names in proper order', async () => {
    const xpath = '//*[@id="swdbList"]/thead/tr[1]/th[7]';
    driver.wait(until.elementLocated(By.xpath(xpath)));
    const field = await driver.findElement(By.xpath(xpath)).getText();
    expect(field).to.equal('Status date (m/d/y)');
  });

  test.it('should show a known record', async () => {
    const elementPath = By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]');
    driver.wait(until.elementLocated(elementPath));
    const link = await driver.findElement(elementPath).getText();
    expect(link).to.equal('BEAST');
  });

  // find a software record
  test.it('should find a sw record', () => {
    driver.get(props.webUrl + '#/list');
    driver.wait(until.elementLocated(By.id('swNameSrch'))).sendKeys('beast');
    driver.wait(until.elementLocated(By.id('versionSrch'))).sendKeys('0.2');
    driver.wait(until.elementLocated(By.id('branchSrch'))).sendKeys('b4');
    driver.wait(until.elementLocated(By.linkText('BEAST')));
    const link = driver.findElement(By.linkText('BEAST'));
    link.getAttribute('href').then((result: string) => {
      expect(result).to.equal(props.webUrl + '#/details/5947589458a6aa0face9a554');
    });
  });
});
