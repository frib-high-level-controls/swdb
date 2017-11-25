const ObjectId = require('mongodb').ObjectID;
import mongo = require('mongodb');
import CommonTools = require('../../app/lib/CommonTools');
import Be = require('../../app/lib/Db');
// const be = new Be.Db();
import InstBe = require('../../app/lib/instDb.js');
const instBe = new InstBe.InstDb();
const tools = new CommonTools.CommonTools();
const props = tools.getConfiguration();
import dbg = require('debug');
const debug = dbg('swdb:TestTools');

import fs = require('fs');
// const testInstData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/instTestDataCombined.json', 'utf8'));
// const testSwData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/swTestDataCombined.json', 'utf8'));

export class TestTools {
  public async loadTestCollectionsStandard(done, swFile: string, instFile: string) {
    const testInstData = JSON.parse(fs.readFileSync(instFile, 'utf-8'));
    const testSwData = JSON.parse(fs.readFileSync(swFile, 'utf8'));
    // console.log("Starting standard test db clear and reload...");
    // before we start loading data, convert _ids to ObjectIDs
    // console.log("Converting ObjectIds...");
    for (const i in testSwData) {
      if ('_id' in testSwData[i]) {
        testSwData[i]._id = ObjectId(testSwData[i]._id);
      }
    }
    for (const i in testInstData) {
      if ('_id' in testInstData[i]) {
        testInstData[i]._id = ObjectId(testInstData[i]._id);
      }
    }

    // console.log("Dropping installation collections...");
    try {
      await InstBe.InstDb.instDoc.db.collections.history.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping ' + err);
        done(err);
      }
    }

    try {
      await Be.Db.swDoc.db.collections.history.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping ' + err);
        done(err);
      }
    }

    try {
      await InstBe.InstDb.instDoc.db.collections.instCollection.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping ' + err);
        done(err);
      }
    }

    try {
      await Be.Db.swDoc.db.collections.swdbCollection.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping ' + err);
        done(err);
      }
    }

    try {
      await Be.Db.swDoc.db.collections.swdbCollection.insert(testSwData);
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping ' + err);
        done(err);
      }
    }
    try {
      await InstBe.InstDb.instDoc.db.collections.instCollection.insert(testInstData);
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping ' + err);
        done(err);
      }
    }

    done();
  }

  public async clearTestCollections(done) {
    try {
      await InstBe.InstDb.instDoc.db.collections.history.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping software history' + err);
        done(err);
      }
    }

    try {
      debug('swDoc: ' + JSON.stringify(Be.Db.swDoc));
      await Be.Db.swDoc.db.collections.history.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping software history' + err);
        done(err);
      }
    }

    try {
        await InstBe.InstDb.instDoc.db.collections.instCollection.drop();
    } catch (err) {
      debug('Error dropping installations');
      done(err);
    }

    try {
      await Be.Db.swDoc.db.collections.swdbCollection.drop();
    } catch (err) {
      debug('Error dropping software');
      done(err);
    }
    done();
  }
}
