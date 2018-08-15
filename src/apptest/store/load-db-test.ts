import dbg = require('debug');
import myTestTools = require('./TestTools.js');

/**
 * Load-test-db.ts
 * Description: A helper program to load the db with test data for validation testing.
 */

const debug = dbg('swdb:load-db');
const a = new myTestTools.TestTools();
a.loadTestCollectionsStandard(debug,
  a.props.test.swTestDataFile,
  a.props.test.instTestDataFile);
