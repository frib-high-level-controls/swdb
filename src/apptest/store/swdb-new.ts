import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import dbg = require('debug');
import webdriver = require('selenium-webdriver');
import chrome = require('selenium-webdriver/chrome');
import test = require('selenium-webdriver/testing');
import Supertest = require('supertest');
import CommonTools = require('../../app/lib/CommonTools');
import server = require('../../app/server');
import TestTools = require('./TestTools');
chai.use(chaiAsPromised);
const ctools = new CommonTools.CommonTools();
let props: CommonTools.IProps;
const prefs = new webdriver.logging.Preferences();
const options = new chrome.Options();
props = ctools.getConfiguration();
const debug = dbg('swdb:swdb-new-tests');
const expect = chai.expect;
const By = webdriver.By;
const until = webdriver.until;
const testTools = new TestTools.TestTools();
let supertest: Supertest.SuperTest<Supertest.Test>;
let app;


test.describe('Software update screen tests', () => {
  let chromeDriver: webdriver.WebDriver;

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
    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  test.describe('1. Test basic error handling', () => {
    test.it('should show search page with login button', function (this: Mocha.ITestCallbackContext) {
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
            const Cookies = res.header['set-cookie'].pop().split(';')[0];
            debug('test login cookies: ' + Cookies);
            const parts = Cookies.split('=');
            debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
            chromeDriver.manage().addCookie({ name: parts[0], value: parts[1] });
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

    test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/new');
      chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()), 5000);
    });

    test.it('Submit should fail', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('Date field should be (Angular) invalid', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      chromeDriver.findElement(By.id('statusDate')).getAttribute('class').then(
        (text: string) => {
          expect(text).to.match(/ng-invalid-required/);
        });
    });

    test.it('should stay on the new form', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
    });

    test.it('Set software status date', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('10/1/2017');
    });

    test.it('Date field should be (Angular) valid', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      chromeDriver.findElement(By.id('statusDate')).getAttribute('class').then(
        (text: string) => {
          expect(text).to.match(/ng-valid-required/);
        });
    });

    test.it('Submit should fail again with software name required error', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.findElement(By.id('submitBtn')).click();
      chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('formError')), 3000);
      chromeDriver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Software name is required/);
        });
    });

    test.it('Set software name', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
      chromeDriver.findElement(By.id('swName')).sendKeys('testswname');
    });

    test.it('Submit should fail again with software owner required error', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.findElement(By.id('submitBtn')).click();
      chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
      chromeDriver.wait(until.elementLocated(By.id('formError')), 3000);
      chromeDriver.findElement(By.id('formError')).getText().then(
        (text) => {
          expect(text).to.match(/Owner is required/);
        });
    });

    test.it('Set software owner', function(this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
      let input = chromeDriver.findElement(By.id('owner'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('controls');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-2"]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-2"]'));
      chromeDriver.wait(until.elementIsVisible(input));
      input.click();
    });

    test.it('Submit should succeed showing the details screen', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.executeScript('scroll(0, 250);');
      chromeDriver.findElement(By.id('submitBtn')).click();
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
    });
  });

  test.describe('2. Add a new software record', () => {
    test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/list');
      chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()), 5000);
    });

    test.it('should show search page with username on logout button', function(this: Mocha.ITestCallbackContext) {
      this.timeout(8000);
      chromeDriver.get(props.webUrl + '#/new');
      chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
      chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
        props.test.username.toUpperCase()), 5000);
    });


    test.it('should show the requested record title', () => {
      chromeDriver.wait(until.titleIs('SWDB - New'), 5000);
    });

    test.it('Set software name', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
      chromeDriver.findElement(By.id('swName')).sendKeys('Test Record3');
    });

    test.it('Set version', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
      const input = chromeDriver.findElement(By.id('version'));
      input.click();
      input.sendKeys('Test Version');
    });

    test.it('Set software branch', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
      const input = chromeDriver.findElement(By.id('branch'));
      input.click();
      input.sendKeys('Test branch');
    });

    test.it('Set software description', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
      const input = chromeDriver.findElement(By.id('desc'));
      input.click();
      input.sendKeys('Test description');
    });

    test.it('Set software description document', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
      const input = chromeDriver.findElement(By.id('descDocLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('Set software design desciption document', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
      const input = chromeDriver.findElement(By.id('designDescDocLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('Set software owner', function(this: Mocha.ITestCallbackContext) {
      this.timeout(15000);

      chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
      let input = chromeDriver.findElement(By.id('owner'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
      input.sendKeys('controls');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-2-2"]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-2-2"]'));
      input.click();
    });

    test.it('Set software level of care', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
      const input = chromeDriver.findElement(By.id('levelOfCare'));
      input.click();
      input.sendKeys('Low');
    });

    test.it('Set software status', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      const input = chromeDriver.findElement(By.id('status'));
      input.click();
      input.sendKeys('Development');
    });

    test.it('Set software status date', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
      let input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
      input.click();
      chromeDriver.wait(until.elementLocated(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
      input = chromeDriver.findElement(
        By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      input = chromeDriver.findElement(By.id('statusDate'));
      input.clear();

      input.sendKeys('10/1/2017');
    });


    test.it('Set software platforms', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
      const input = chromeDriver.findElement(By.id('platforms'));
      input.click();
      input.sendKeys('Test platform');
    });

    test.it('Set software V&V procedure location', function(this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      chromeDriver.wait(until.elementLocated(By.id('add.vvProcLoc')), 3000);
      let input = chromeDriver.findElement(By.id('add.vvProcLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.0')), 3000);
      const input0 = chromeDriver.findElement(By.id('vvProcLoc.0'));
      input0.sendKeys('http://procservtest.com/procdoc0');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.1')), 3000);
      const input1 = chromeDriver.findElement(By.id('vvProcLoc.1'));
      input1.sendKeys('http://procservtest.com/procdoc1');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvProcLoc.2')), 3000);
      const input2 = chromeDriver.findElement(By.id('vvProcLoc.2'));
      input2.sendKeys('http://procservtest.com/procdoc2');
      // remove the first entry
      chromeDriver.wait(until.elementLocated(By.id('rm.vvProcLoc.0')), 3000);
      input = chromeDriver.findElement(By.id('rm.vvProcLoc.0'));
      input.click();
    });


    test.it('Set software V&V results location', function(this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      chromeDriver.wait(until.elementLocated(By.id('add.vvResultsLoc')), 3000);
      let input = chromeDriver.findElement(By.id('add.vvResultsLoc'));
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.0')), 3000);
      const input0 = chromeDriver.findElement(By.id('vvResultsLoc.0'));
      input0.sendKeys('http://resultservtest.com/resultsdoc0');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.1')), 3000);
      const input1 = chromeDriver.findElement(By.id('vvResultsLoc.1'));
      input1.sendKeys('http://resultservtest.com/resultsdoc1');
      input.click();
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc.2')), 3000);
      const input2 = chromeDriver.findElement(By.id('vvResultsLoc.2'));
      input2.sendKeys('http://resultservtest.com/resultdoc2');
      // remove the first entry
      chromeDriver.wait(until.elementLocated(By.id('rm.vvResultsLoc.0')), 3000);
      input = chromeDriver.findElement(By.id('rm.vvResultsLoc.0'));
      input.click();
    });

    test.it('Set software version control', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
      const input = chromeDriver.findElement(By.id('versionControl'));
      input.click();
      input.sendKeys('Git');
    });

    test.it('Set software version control location', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
      const input = chromeDriver.findElement(By.id('versionControlLoc'));
      input.click();
      input.sendKeys('http://www.google.com');
    });

    test.it('Set software engineer', function(this: Mocha.ITestCallbackContext) {
      this.timeout(15000);
      chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
      let input = chromeDriver.findElement(By.id('engineer'));
      chromeDriver.executeScript('scroll(0, -250);');
      input.click();
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
      input.sendKeys('ellisr');
      chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-3-0"]')));
      input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-3-0"]'));
      input.click();
    });

    test.it('Submit', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.findElement(By.id('submitBtn')).click();
    });

    test.it('should show the details record', function(this: Mocha.ITestCallbackContext) {
      this.timeout(5000);
      chromeDriver.wait(until.titleIs('SWDB - Details'), 5000);
    });
  });

  test.describe('3. Verify details', () => {
    test.it('should show the correct software name in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
      chromeDriver.findElement(By.id('swName')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test Record3');
        });
    });

    test.it('should show the correct version in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('version')), 3000);
      chromeDriver.findElement(By.id('version')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test Version');
        });
    });

    test.it('should show the correct branch in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('branch')), 3000);
      chromeDriver.findElement(By.id('branch')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test branch');
        });
    });

    test.it('should show the correct descption in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('desc')), 3000);
      chromeDriver.findElement(By.id('desc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test description');
        });
    });

    test.it('should show the correct descption doc location in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('descDocLoc')), 3000);
      chromeDriver.findElement(By.id('descDocLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://www.google.com');
        });
    });

    test.it('should show the correct design descption doc location in details',
      function(this: Mocha.ITestCallbackContext) {
        chromeDriver.wait(until.elementLocated(By.id('designDescDocLoc')), 3000);
        chromeDriver.findElement(By.id('designDescDocLoc')).getAttribute('value').then(
          (text: string) => {
            expect(text).to.equal('http://www.google.com');
          });
      });

    test.it('should show the correct owner in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('owner')), 3000);
      chromeDriver.findElement(By.id('owner')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('IFS:LAB.FRIB.ASD.CONTROLS.EBC');
        });
    });

    test.it('should show the correct engineer in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('engineer')), 3000);
      chromeDriver.findElement(By.id('engineer')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('ELLISR');
        });
    });

    test.it('should show the correct level of care in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('levelOfCare')), 3000);
      chromeDriver.findElement(By.id('levelOfCare')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Low');
        });
    });

    test.it('should show the correct status in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('status')), 3000);
      chromeDriver.findElement(By.id('status')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Development');
        });
    });

    test.it('should show the status date in details', () => {
      chromeDriver.wait(until.elementLocated(By.id('statusDate')), 3000);
      chromeDriver.findElement(By.id('statusDate')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('10/1/2017');
        });
    });

    test.it('should show the correct platforms in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('platforms')), 3000);
      chromeDriver.findElement(By.id('platforms')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Test platform');
        });
    });

    test.it('should show the correct vvProcLoc in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('vvProcLoc')), 3000);
      chromeDriver.findElement(By.id('vvProcLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://procservtest.com/procdoc1,http://procservtest.com/procdoc2');
        });
    });

    test.it('should show the correct vvResultsLoc in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('vvResultsLoc')), 3000);
      chromeDriver.findElement(By.id('vvResultsLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2');
        });
    });

    test.it('should show the correct version control location in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('versionControl')), 3000);
      chromeDriver.findElement(By.id('versionControl')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('Git');
        });
    });

    test.it('should show the correct version control location in details', function(this: Mocha.ITestCallbackContext) {
      chromeDriver.wait(until.elementLocated(By.id('versionControlLoc')), 3000);
      chromeDriver.findElement(By.id('versionControlLoc')).getAttribute('value').then(
        (text: string) => {
          expect(text).to.equal('http://www.google.com');
        });
    });
  });

});
