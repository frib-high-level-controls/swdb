import myTestTools = require('./TestTools.js');
import dbg = require('debug');

/**
 * clear-test-db.ts
 * Description: A helper program to clear the db for validation testing.
 */

const debug = dbg('swdb:clear-test-db');
let a = new myTestTools.TestTools();
a.clearTestCollections(debug);
