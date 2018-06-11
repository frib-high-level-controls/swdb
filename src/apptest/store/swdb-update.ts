import server = require('../../app/server');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import Supertest = require('supertest');
import TestTools = require('./TestTools');
import webdriver = require('selenium-webdriver');
import test = require('selenium-webdriver/testing');
import chrome = require('selenium-webdriver/chrome');
import dbg = require('debug');
import CommonTools = require('../../app/lib/CommonTools');

const debug = dbg('swdb:swdb-update-tests');
let supertest: Supertest.SuperTest<Supertest.Test>;
let expect = chai.expect;
chai.use(chaiAsPromised);
let app;
let testTools = new TestTools.TestTools();
let By = webdriver.By;
let until = webdriver.until;
let options = new chrome.Options();
let prefs = new webdriver.logging.Preferences();
let ctools = new CommonTools.CommonTools();
let props: CommonTools.IProps;
props = ctools.getConfiguration();


test.describe('Software update screen tests', () => {
  let chromeDriver: webdriver.WebDriver;
  let tmpStatusDate: Date;

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
    if (props.test.showLogs === 'true') {
      debug('printing logs...' + props.test.showLogs);
      chromeDriver.manage().logs().get(webdriver.logging.Type.BROWSER)
        .then((logs) => {
          debug(logs);
        });
    } else {
      debug('not printing logs...' + props.test.showLogs);
    }

    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  test.it('should show search page with login button', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    prefs.setLevel(webdriver.logging.Type.BROWSER, webdriver.logging.Level.ALL);
    options.setLoggingPrefs(prefs);
    chromeDriver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .setChromeOptions(options)
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    chromeDriver.get(props.webUrl + '#/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      'Log in'), 5000);
  });

  test.it('login as test user', function(this: Mocha.ITestCallbackContext, done: MochaDone) {
    this.timeout(8000);
    supertest
    .get('/login')
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end((err: Error, res: Supertest.Response) => {
      if (err) {
        done(err);
      } else {
        let Cookies = res.header['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + Cookies);
        let parts = Cookies.split('=');
        debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
        chromeDriver.manage().addCookie({name: parts[0], value: parts[1]});
        done();
      }
    });
  });

  test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it('should show new page with username on logout button', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/new');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });


  test.it('should show the requested installation record title', () => {
    chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
  });

  test.it('Add new record', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).sendKeys('Test Record3');
  });

  test.it('set version for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set version
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    let input = chromeDriver.findElement(By.id('version'));
    input.click();
    input.sendKeys('Test Version');
  });

  test.it('set branch for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set branch
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    let input = chromeDriver.findElement(By.id('branch'));
    input.click();
    input.sendKeys('Test branch');
  });

  test.it('set description for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set description
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
    let input = chromeDriver.findElement(By.id('desc'));
    input.click();
    input.sendKeys('Test description');
  });

  test.it('set description doc for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set description document
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
    let input = chromeDriver.findElement(By.id('descDocLoc'));
    input.click();
    input.sendKeys('http://www.google.com');
  });

  test.it('set design description doc for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set design description document
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
    let input = chromeDriver.findElement(By.id('designDescDocLoc'));
    input.click();
    input.sendKeys('http://www.google.com');
  });

  test.it('set owner for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set owner
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
    let input = chromeDriver.findElement(By.id('owner'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
    input.sendKeys('controls');
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-2"]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-2"]'));
    input.click();
  });

  test.it('set level of care for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set level of care
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
    let input = chromeDriver.findElement(By.id('levelOfCare'));
    input.click();
    input.sendKeys('Low');
  });

  test.it('set status for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set status
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    let input = chromeDriver.findElement(By.id('status'));
    input.click();
    input.sendKeys('Development');
  });

  test.it('set status date for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set status date
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
    let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(
      By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
    input.click();
    tmpStatusDate = new Date();
  });

  test.it('set platforms for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set platforms
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
    let input = chromeDriver.findElement(By.id('platforms'));
    input.click();
    input.sendKeys('Test platform');
  });

  test.it('set V&V procedure loc for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set vvProcLoc
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('add.vvProcLoc')), 3000);
    let input = chromeDriver.findElement(By.id('add.vvProcLoc'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.0')), 3000);
    let input0 = chromeDriver.findElement(By.id('vvProcLoc.0'));
    input0.sendKeys('http://procservtest.com/procdoc0');
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.1')), 3000);
    let input1 = chromeDriver.findElement(By.id('vvProcLoc.1'));
    input1.sendKeys('http://procservtest.com/procdoc1');
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.2')), 3000);
    let input2 = chromeDriver.findElement(By.id('vvProcLoc.2'));
    input2.sendKeys('http://procservtest.com/procdoc2');
    // remove the first entry
    chromeDriver.wait(until.elementLocated(By.id('rm.vvProcLoc.0')), 3000);
    input = chromeDriver.findElement(By.id('rm.vvProcLoc.0'));
    input.click();
  });


  test.it('set V&V results loc for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set vvResultsLoc
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
    let input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.0')), 3000);
    let input0 = chromeDriver.findElement(By.id('vvResultsLoc.0'));
    input0.sendKeys('http://resultservtest.com/resultsdoc0');
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.1')), 3000);
    let input1 = chromeDriver.findElement(By.id('vvResultsLoc.1'));
    input1.sendKeys('http://resultservtest.com/resultsdoc1');
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.2')), 3000);
    let input2 = chromeDriver.findElement(By.id('vvResultsLoc.2'));
    input2.sendKeys('http://resultservtest.com/resultdoc2');
    // remove the first entry
    chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')), 3000);
    input = chromeDriver.findElement(By.id('rm.vvResultsLoc.0'));
    input.click();
  });

  test.it('set version control for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set version control
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
    let input = chromeDriver.findElement(By.id('versionControl'));
    input.click();
    input.sendKeys('Debian');
  });

  test.it('set version control loc for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set version control location
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
    let input = chromeDriver.findElement(By.id('versionControlLoc'));
    input.click();
    input.sendKeys('http://www.google.com');
  });

  test.it('set engineer for new sw record', function(this: Mocha.ITestCallbackContext) {
    // set engineer
    this.timeout(10000);
    chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
    let input = chromeDriver.findElement(By.id('engineer'));
    chromeDriver.executeScript('scroll(0, -250);');
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
    input.sendKeys('ellisr');
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-1-0"]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-1-0"]'));
    input.click();
  });

  test.it('Submit',  () => {
    chromeDriver.findElement(By.id('submitBtn')).click();
  });

  test.it('should show the details record', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
  });

  test.it('should show the correct software name in details',  () => {
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Record3');
      });
  });

  // find the created record
  test.it('should find a record', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/list');
    chromeDriver.wait(until.elementLocated(By.id('swNameSrch')), 8000)
      .sendKeys('Record3');
    chromeDriver.wait(until.elementLocated(By.id('versionSrch')), 8000)
      .sendKeys('Test version');
    chromeDriver.wait(until.elementLocated(By.linkText('Test Record3')),
      8000);
  });

  // find the created record and click update
  test.it('should show record details', function(this: Mocha.ITestCallbackContext) {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.linkText('Test Record3')),
      8000).click();
    chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
    chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
      8000).click();
  });

  test.it('should show the update title', () => {
    chromeDriver.wait(until.titleIs('SWDB - Update'), 5000);
  });

  test.it('should show the correct software name in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Record3');
      });
  });

  test.it('should show the correct software branch in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    chromeDriver.findElement(By.id('branch')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test branch');
      });
  });

  test.it('should show the correct software version in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    chromeDriver.findElement(By.id('version')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Version');
      });
  });

  test.it('should show the correct description in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
    chromeDriver.findElement(By.id('desc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test description');
      });
  });

  test.it('should show the correct description doc in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
    chromeDriver.findElement(By.id('descDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct design description doc in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
    chromeDriver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct owner in update', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.xpath('//*[@id="owner"]/div[1]/span/span[2]/span')),
      'IFS:LAB.FRIB.ASD.CONTROLS.EBC'), 5000);
  });

  test.it('should show the correct engineer in update', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.xpath('//*[@id="engineer"]/div[1]/span/span[2]/span')),
      'ELLISR'), 5000);
  });

  test.it('should show the correct levelOfCare in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
    chromeDriver.findElement(By.id('levelOfCare')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Low');
      });
  });

  test.it('should show the correct status in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Development');
      });
  });

  test.it('should show the status date in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
    chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
      (text: String) => {
        expect(text).to.equal(
         ('0' + (tmpStatusDate.getMonth() + 1)).slice(-2) + '/' +
         ('0' + tmpStatusDate.getDate()).slice(-2) + '/' +
         tmpStatusDate.getFullYear());
      });
  });

  test.it('should show the correct platforms in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
    chromeDriver.findElement(By.id('platforms')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test platform');
      });
  });

  test.it('should show the correct versionControl in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
    chromeDriver.findElement(By.id('versionControl')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Debian');
      });
  });

  test.it('should show the correct versionControlLoc in update', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
    chromeDriver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should update a record', function(this: Mocha.ITestCallbackContext) {
    this.timeout(20000);
    chromeDriver.wait(until.elementLocated(By.id('desc')), 8000)
      .clear();
    chromeDriver.wait(until.elementLocated(By.id('desc')), 8000)
      .sendKeys('New Test Description');
    chromeDriver.wait(until.elementLocated(By.id('submitBtn')), 8000)
      .click();
  });

  test.it('should show the details record', function(this: Mocha.ITestCallbackContext) {
    this.timeout(20000);
    chromeDriver.wait(until.titleIs('SWDB - Details'), 20000);
  });

  test.it('should show the correct description in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
    chromeDriver.findElement(By.id('desc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('New Test Description');
      });
  });

  test.it('should show the correct software name in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Record3');
      });
  });

  test.it('should show the correct software branch in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    chromeDriver.findElement(By.id('branch')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test branch');
      });
  });

  test.it('should show the correct software version in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    chromeDriver.findElement(By.id('version')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Version');
      });
  });

  test.it('should show the correct description doc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
    chromeDriver.findElement(By.id('descDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct design description doc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
    chromeDriver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct owner in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
    chromeDriver.findElement(By.id('owner')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.EBC');
      });
  });

  test.it('should show the correct engineer in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
    chromeDriver.findElement(By.id('engineer')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('ELLISR');
      });
  });

  test.it('should show the correct levelOfCare in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
    chromeDriver.findElement(By.id('levelOfCare')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Low');
      });
  });

  test.it('should show the correct status in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Development');
      });
  });

  test.it('should show the status date in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
    chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
      (text: String) => {
        expect(text).to.equal(
          (tmpStatusDate.getMonth() + 1) + '/' +
          tmpStatusDate.getDate() + '/' +
          tmpStatusDate.getFullYear());
      });
  });

  test.it('should show the correct platforms in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
    chromeDriver.findElement(By.id('platforms')).getAttribute('value').then(
       (text) => {
        expect(text).to.equal('Test platform');
      });
  });

  test.it('should show the correct vvProcLoc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('vvProcLoc')), 3000);
    chromeDriver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://procservtest.com/procdoc1,http://procservtest.com/procdoc2');
      });
  });

  test.it('should show the correct vvResultsLoc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
    chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
      });
  });

  test.it('should show the correct versionControl in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
    chromeDriver.findElement(By.id('versionControl')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Debian');
      });
  });

  test.it('should show the correct versionControlLoc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
    chromeDriver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

/**
 * Click the version update button on the details page and check field defaults on
 * the resulting new record page.
 */
  test.it('should click new version shows new record page ', () => {
    chromeDriver.wait(until.elementLocated(By.id('bumpVerBtn')),
      8000).click();
    chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
  });

  test.it('should show the correct description in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
    chromeDriver.findElement(By.id('desc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('New Test Description');
      });
  });

  test.it('should show the correct software name in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Record3');
      });
  });

  test.it('should show the correct software branch in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    chromeDriver.findElement(By.id('branch')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct software version in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    chromeDriver.findElement(By.id('version')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct description doc in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
    chromeDriver.findElement(By.id('descDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct design description doc in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
    chromeDriver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct owner in bump version new', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.xpath('//*[@id="owner"]/div[1]/span/span[2]/span')),
      'IFS:LAB.FRIB.ASD.CONTROLS.EBC'), 5000);
  });

  test.it('should show the correct engineer in bump version new', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.xpath('//*[@id="engineer"]/div[1]/span/span[2]/span')),
      'ELLISR'), 5000);
  });

  test.it('should show the correct levelOfCare in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
    chromeDriver.findElement(By.id('levelOfCare')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Low');
      });
  });

  test.it('should show the correct status in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Development');
      });
  });

  // test.it("should show the correct statusDate in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
  //   chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

  test.it('should show the correct platforms in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
    chromeDriver.findElement(By.id('platforms')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test platform');
      });
  });

  // test.it("should show the correct vvProcLoc in bump version new", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("vvProcLoc")), 3000);
  //   chromeDriver.findElement(By.id("vvProcLoc")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("http://procservtest.com/procdoc1,http://procservtest.com/procdoc2");
  //     });
  // });

  // test.it("should show the correct vvResultsLoc in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")), 3000);
  //   chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("");
  //     });
  // });

  test.it('should show the correct versionControl in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
    chromeDriver.findElement(By.id('versionControl')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Debian');
      });
  });

  test.it('should show the correct versionControlLoc in bump version new', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
    chromeDriver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });


/**
 * Update the branch and version and check the resulting details screen
 */
  test.it('should update the branch and version and submit ', function(this: Mocha.ITestCallbackContext) {
    this.timeout(5000);
    // set version
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    let input = chromeDriver.findElement(By.id('version'));
    chromeDriver.executeScript('scroll(0, -250);');
    input.click();
    input.sendKeys('Bumped Version');

    // set branch
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    input = chromeDriver.findElement(By.id('branch'));
    chromeDriver.executeScript('scroll(0, -250);');
    input.click();
    input.sendKeys('Bumped Branch');
    chromeDriver.wait(until.elementLocated(By.id('submitBtn')),
      8000).click();
    chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
  });

  test.it('should show the correct description in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
    chromeDriver.findElement(By.id('desc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('New Test Description');
      });
  });

  test.it('should show the correct software name in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test Record3');
      });
  });

  test.it('should show the correct software branch in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
    chromeDriver.findElement(By.id('branch')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Bumped Branch');
      });
  });

  test.it('should show the correct software version in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
    chromeDriver.findElement(By.id('version')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Bumped Version');
      });
  });

  test.it('should show the correct description doc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
    chromeDriver.findElement(By.id('descDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct design description doc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
    chromeDriver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

  test.it('should show the correct owner in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
    chromeDriver.findElement(By.id('owner')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.EBC');
      });
  });

  test.it('should show the correct engineer in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
    chromeDriver.findElement(By.id('engineer')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('ELLISR');
      });
  });

  test.it('should show the correct levelOfCare in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
    chromeDriver.findElement(By.id('levelOfCare')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Low');
      });
  });

  test.it('should show the correct status in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
    chromeDriver.findElement(By.id('status')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Development');
      });
  });

  // test.it("should show the correct statusDate in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
  //   chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

  test.it('should show the correct platforms in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
    chromeDriver.findElement(By.id('platforms')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Test platform');
      });
  });

  test.it('should show the correct vvProcLoc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('vvProcLoc')), 3000);
    chromeDriver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://procservtest.com/procdoc1,http://procservtest.com/procdoc2');
      });
  });

  test.it('should show the correct vvResultsLoc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
    chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('');
      });
  });

  test.it('should show the correct versionControl in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
    chromeDriver.findElement(By.id('versionControl')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('Debian');
      });
  });

  test.it('should show the correct versionControlLoc in details', () => {
    chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
    chromeDriver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
      (text) => {
        expect(text).to.equal('http://www.google.com');
      });
  });

/**
 * Test the hisory section
 * Do another update
 * Then check the history table
 */

  test.it('should go to update', () => {
    chromeDriver.wait(until.elementLocated(By.id('updateBtn')),
      8000).click();
    chromeDriver.wait(until.titleIs('SWDB - Update'), 5000);
  });

  test.it('should update the same record', function(this: Mocha.ITestCallbackContext) {
    this.timeout(20000);
    chromeDriver.wait(until.elementLocated(By.id('desc')), 8000)
      .clear();
    chromeDriver.wait(until.elementLocated(By.id('desc')), 8000)
      .sendKeys('New Test Description2');
    chromeDriver.wait(until.elementLocated(By.id('submitBtn')), 8000)
      .click();
  });

  test.it('should show the history table in details', function(this: Mocha.ITestCallbackContext) {
    this.timeout(10000);
    chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
  });

  test.it('should show both desc changes in the history table of details', function(this: Mocha.ITestCallbackContext) {
    this.timeout(20000);
    chromeDriver.wait(until.elementLocated(By.id('hist.0')), 3000);
    let input = chromeDriver.findElement(By.id('hist.0'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('histPathName.0.0')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('histPathName.0.0')),
       'desc'), 3000);
    chromeDriver.wait(until.elementLocated(By.id('histPathValue.0.0')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('histPathValue.0.0')),
       'New Test Description2'), 3000);
  });
});
