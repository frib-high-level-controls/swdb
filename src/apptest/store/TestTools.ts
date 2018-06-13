const ObjectId = require('mongodb').ObjectID;
import mongo = require('mongodb');
import CommonTools = require('../../app/lib/CommonTools');
import Be = require('../../app/lib/Db');
const be = new Be.Db();
import InstBe = require('../../app/lib/instDb.js');
const instBe = new InstBe.InstDb();
import dbg = require('debug');
const debug = dbg('swdb:TestTools');
import _ = require('lodash');

import fs = require('fs');

export class TestTools {
  public tools = new CommonTools.CommonTools();
  public props = this.tools.getConfiguration();

  // public async loadTestCollectionsStandard(done, swFile: string, instFile: string) {
  public async loadTestCollectionsStandard(sdebug: debug.IDebugger, swFile: string, instFile: string) {
    await be.chkConn();
    await instBe.chkConn();
    let testInstData: any[] = [];
    let testSwData: any[] = [];
    sdebug('loading test DB');
    try {
      testInstData = JSON.parse(fs.readFileSync(instFile, 'utf-8'));
      testSwData = JSON.parse(fs.readFileSync(swFile, 'utf8'));
    } catch (err) {
      sdebug(err);
    }
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
      sdebug('Inserting test sw data');
      await Be.Db.swDoc.db.collections.swdbCollection.insert(testSwData).exec();
      // await Be.Db.swDoc.init();
      // await InstBe.InstDb.instDoc.init();
      await be.chkIdx();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
      } else {
        sdebug('Error inserting ' + err);
      }
    }
    try {
      sdebug('Inserting test installation data');
      await InstBe.InstDb.instDoc.db.collections.instCollection.insert(testInstData).exec();
      // await Be.Db.swDoc.init();
      // await InstBe.InstDb.instDoc.init();
      await instBe.chkIdx();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
      } else {
        sdebug('Error inserting ' + err);
      }
    }
  }
  /**
   *  loadCollectionsWithHistory - loads the given data with history
   *
   * @param sdebug The callers debug object for easy debugging
   * @param swFile The path/filename of the sw JSON data to load
   * @param instFile The path/filename of the installation JSON data to load
   */
  public async loadCollectionsWithHistory(sdebug: debug.IDebugger, swFile: string, instFile: string) {
    await be.chkConn();
    await instBe.chkConn();
    let testInstData: any[] = [];
    let testSwData: any[] = [];
    sdebug('loading DB with history');
    try {
      testInstData = JSON.parse(fs.readFileSync(instFile, 'utf-8'));
      testSwData = JSON.parse(fs.readFileSync(swFile, 'utf8'));
    } catch (err) {
      sdebug(err);
    }
    // before we start loading data, convert _ids to ObjectIDs
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
      testSwData.forEach(async (swRec) => {
        await be.createDocByRecord('Automated-ETL', swRec);
        sdebug('Inserting software ' + JSON.stringify(swRec));
      });
      debug('Indexing status: ' + JSON.stringify(status));
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
        // ignore this
      } else {
        sdebug('Error inserting ' + err);
      }
    }
    try {
      testInstData.forEach(async (instRec) => {
        await instBe.createDocByRecord('Automated-ETL', instRec);
        sdebug('Inserting installation' + JSON.stringify(instRec));
      });
      await Be.Db.swDoc.init();
      await InstBe.InstDb.instDoc.init();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
      } else {
        sdebug('Error inserting ' + err);
      }
    }
  }

  public async clearTestCollections(sdebug: debug.IDebugger) {
    await be.chkConn();
    await instBe.chkConn();
    sdebug('Clearing test collections');
    try {
      sdebug('Clearing inst history');
      await InstBe.InstDb.instDoc.db.collections.history.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
      } else {
        sdebug('Error dropping installation history' + err);
      }
    }

    if (typeof Be.Db.swDoc != null) {
      try {
        sdebug('swDoc: ' + JSON.stringify(Be.Db.swDoc));
        sdebug('Clearing swdb history');
        await Be.Db.swDoc.db.collections.history.drop();
      } catch (err) {
        if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
          sdebug('ignoring err: ' + JSON.stringify(err));
        } else {
          sdebug('Error dropping software history' + err);
        }
      }
    }

    try {
        sdebug('Clearing inst collection');
        await InstBe.InstDb.instDoc.db.collections.instCollection.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
      } else {
        sdebug('Error dropping installation collection' + err);
      }
    }

    try {
      sdebug('Clearing swdb collection');
      await Be.Db.swDoc.db.collections.swdbCollection.drop();
    } catch (err) {
      if ((err instanceof mongo.MongoError) && (err.message === 'ns not found')) {
        sdebug('ignoring err: ' + JSON.stringify(err));
      } else {
        sdebug('Error dropping software collection' + err);
      }
    }
    await Be.Db.swDoc.init();
    await InstBe.InstDb.instDoc.init();
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
          sdebug(err);
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
        sdebug(err);
      }
    } else {
      sdebug('SW collection is empty');
    }

    cursor = InstBe.InstDb.instDoc.db.collections.instCollection.find();
    if (cursor) {
      try {
        let count = await cursor.count();
        sdebug('Installation collection reports ' + count + ' items');
      } catch (err) {
        sdebug(err);
      }
    } else {
      sdebug('Installation collection is empty');
    }
  }

  public async dumpCollection(sdebug: debug.IDebugger, coll: mongo.Collection, search: any) {
    sdebug('Test collections dump(' + JSON.stringify(search) + '):');
    let cursor = coll.find(search).sort({at: -1});
    try {
      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        sdebug('Dumped Record ' + JSON.stringify(doc));
      }
    } catch (err) {
      sdebug(err);
    }
  }

  public async checkHistory(sdebug: debug.IDebugger, canonObj: {[key: string]: string | Date}, id: number) {
  /**
   * Search history for id as an rid field. Sort that list by date and take the latest.
   * Take the original object data as canonical, compare each field to the history,
   * removing each found field from canonCheckList. If empty when done, all is well.
   *
   * Be mindful of object types here. For instance Date object may need to be checked
   * using a string representation. Others may be more complex.
   *
   * @params sdebug Description Debugger channel to report on.
   * @params canonObj Desription The object submitted to the db.
   * @params id Description The db id returned from the object submission.
   */
    let canonCheckList = canonObj;
    let cursor = Be.Db.swDoc.db.collections.history.find({ rid: ObjectId(id) }).sort({at: -1}).limit(1);
    // let cursor = Be.Db.swDoc.db.collections.history.find();
    let msg = '';
    try {
      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        sdebug('Got history ' + doc._id + ' with  rid ' + id + JSON.stringify(doc));
        for (let canonKey of Object.keys(canonObj)) {
          // we should find an paths array object where name: "swName" and value: value
          for (let item of doc.paths) {
            // sdebug('searching element ' + JSON.stringify(item) + ' for ' + canonKey);
            if (item['name'] === canonKey) {
              // sdebug('Found name = ' + canonKey);
              // if (item['value'] === canonObj[canonKey]) {
              if (_.isEqual(item['value'], canonObj[canonKey])) {
                sdebug('Found name = ' + canonKey + ' AND value = ' + canonObj[canonKey]);
                delete canonCheckList[canonKey];
              } else {
                msg = 'History item ' + canonKey + ': ' + item['value'] + ' does not match ' + canonObj[canonKey];
                sdebug(msg);
              }
            }
          }
        }
        if (Object.keys(canonCheckList).length === 0) {
          sdebug('history entry is good ' + JSON.stringify(canonCheckList));
          return('History record matches');
        } else {
          sdebug('Cannot find ' + JSON.stringify(canonCheckList) + ' in history');
          sdebug(Object.keys(canonCheckList));
          return(msg);
        }
      }
    } catch (err) {
      sdebug(err);
    }
  }
}
