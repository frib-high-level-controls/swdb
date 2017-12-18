import myTestTools = require('./TestTools.js');
import dbg = require('debug');

/**
 * Load-test-db.ts
 * Description: A helper program to load the db with test data for validation testing.
 */

const debug = dbg('swdb:load-test-db');
let a = new myTestTools.TestTools();
a.loadTestCollectionsStandard(debug,
  '/home/deployer/swdb/src/apptest/misc/datafiles/swTestDataCombined.json',
  '/home/deployer/swdb/src/apptest/misc/datafiles/instTestDataCombined.json');
