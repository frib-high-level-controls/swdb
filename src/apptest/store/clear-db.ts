import myTestTools = require('./TestTools.js');
import dbg = require('debug');

/**
 * clear-db.ts
 * Description: A helper program to clear the db for validation testing.
 */

const debug = dbg('swdb:clear-db');
let a = new myTestTools.TestTools();
a.clearTestCollections(debug);
