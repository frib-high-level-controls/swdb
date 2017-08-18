const ObjectId = require('../../../node_modules/mongodb').ObjectID;
import CommonTools = require('../../app/lib/CommonTools');
import Be = require('../../app/lib/Db');
const be = new Be.Db();
import instBe = require('../../app/lib/instDb.js');
const tools = new CommonTools.CommonTools();
const props = tools.getConfiguration();

import fs = require('fs');
const testInstData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/instTestDataCombined.json', 'utf8'));
const testSwData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/swTestDataCombined.json', 'utf8'));
const testSwNames = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/swTestNames.json', 'utf8'));

export class TestTools {
  public loadTestCollectionsStandard(done) {
    // console.log("Starting standard test db clear and reload...");
    // before we start loading data, convert _ids to ObjectIDs
    // console.log("Converting ObjectIds...");
    for ( const i in testSwNames) {
      if ('_id' in testSwNames[i]) {
        testSwNames[i]._id = ObjectId(testSwNames[i]._id);
      }
    }
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
    instBe.instDoc.db.collections.instCollection.drop(
      (err) => {
        // console.log("Dropping sw collections...");
        Be.Db.swDoc.db.collections.swdbCollection.drop(
          (swDocDropErr) => {
            // console.log("Dropping swNames collections...");
            Be.Db.swDoc.db.collections.swNamesProp.drop(
              (swNamesDropErr) => {
                // console.log("inserting testSwNames in sw collection");
                Be.Db.swNamesDoc.db.collections.swNamesProp.insert(testSwNames,
                  (swNameInsertErr, records) => {
                    // console.log("inserting testSwData in installations collection");
                    Be.Db.swDoc.db.collections.swdbCollection.insert(testSwData,
                      (swDocInsertErr, swDocRecords) => {
                        // console.log("inserting testInstData in installations collection");
                        instBe.instDoc.db.collections.instCollection.insert(testInstData,
                          (instInsertErr, instRecords) => {
                            done();
                          });
                      });
                  });
              });
          });
      });
  }

  public clearTestCollections(done) {
    // console.log("Cleaning up...");
    // console.log("Dropping installation collections...");
    instBe.instDoc.db.collections.instCollection.drop((err) => {
      // chromeDriver.quit();
      // console.log("Dropping swdb collections...");
      Be.Db.swDoc.db.collections.swdbCollection.drop((swDocDropErr) => {
      // console.log("Dropping swdbNames collections...");
        Be.Db.swDoc.db.collections.swNamesProp.drop((swNamesDropErr) => {
          done();
        });
      });
    });
  }
}
