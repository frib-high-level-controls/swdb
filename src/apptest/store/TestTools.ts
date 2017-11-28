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
        debug('Error dropping installation history' + err);
        done(err);
      }
    }

    if (typeof Be.Db.swDoc != null) {
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
    }

    try {
        await InstBe.InstDb.instDoc.db.collections.instCollection.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        debug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        debug('Error dropping installation collection' + err);
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
        debug('Error dropping software collection' + err);
        done(err);
      }
    }
    done();
  }

  public async testCollectionsStatus(sdebug: debug.IDebugger) {
    sdebug('Test collections report:');
    if (Be.Db.swDoc.db.collections.history) {
      let cursor = Be.Db.swDoc.db.collections.history.find();
      if (cursor) {
        try {
          let count = await cursor.count();
          sdebug('SW history reports ' + count + ' items');
        } catch (err) {
          throw (err);
        }
      } else {
        sdebug('SW history is empty');
      }
    }

    let cursor = Be.Db.swDoc.db.collections.swdbCollection.find();
    if (cursor) {
      try {
        let count = await cursor.count();
        sdebug('SW collection reports ' + count + ' items');
      } catch (err) {
        throw (err);
      }
    } else {
      sdebug('SW collection is empty');
    }

    cursor = InstBe.InstDb.instDoc.db.collections.history.find();
    if (cursor) {
      try {
        let count = await cursor.count();
        sdebug('Installation history reports ' + count + ' items');
      } catch (err) {
        throw (err);
      }
    } else {
      sdebug('Installation history is empty');
    }

    cursor = InstBe.InstDb.instDoc.db.collections.instCollection.find();
    if (cursor) {
      try {
        let count = await cursor.count();
        sdebug('Installation collection reports ' + count + ' items');
      } catch (err) {
        throw (err);
      }
    } else {
      sdebug('Installation collection is empty');
    }
  }

  public async dumpCollection(sdebug: debug.IDebugger, coll: mongo.Collection) {
    sdebug('Test collections dump:');
    let cursor = coll.find();
    try {
      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        sdebug('Record ' + JSON.stringify(doc));
      }
    } catch (err) {
      sdebug(err);
    }
  }
}
