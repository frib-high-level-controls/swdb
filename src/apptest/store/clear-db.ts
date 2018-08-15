import dbg = require('debug');
import myTestTools = require('./TestTools.js');

/**
 * clear-db.ts
 * Description: A helper program to clear the db for validation testing.
 */

const debug = dbg('swdb:clear-db');
const a = new myTestTools.TestTools();
a.clearTestCollections(debug);
