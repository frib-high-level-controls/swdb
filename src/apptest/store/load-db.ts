import myTestTools = require('./TestTools.js');
import dbg = require('debug');

/**
 * Load-test-db.ts
 * Description: A helper program to load the db with test data for validation testing.
 */

const debug = dbg('swdb:load-db');
let a = new myTestTools.TestTools();
a.loadCollectionsWithHistory(debug,
  a.props.test.swTestDataFile,
  a.props.test.instTestDataFile);
