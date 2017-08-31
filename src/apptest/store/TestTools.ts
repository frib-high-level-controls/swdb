const ObjectId = require('../../../node_modules/mongodb').ObjectID;
import CommonTools = require('../../app/lib/CommonTools');
import Be = require('../../app/lib/Db');
const be = new Be.Db();
import InstBe = require('../../app/lib/instDb.js');
const instBe = new InstBe.InstDb();
const tools = new CommonTools.CommonTools();
const props = tools.getConfiguration();

import fs = require('fs');
const testInstData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/instTestDataCombined.json', 'utf8'));
const testSwData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/swTestDataCombined.json', 'utf8'));

export class TestTools {
  public loadTestCollectionsStandard(done) {
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
    InstBe.InstDb.instDoc.db.collections.instCollection.drop(
      (err) => {
        // console.log("Dropping sw collections...");
        Be.Db.swDoc.db.collections.swdbCollection.drop(
          (swDocDropErr) => {
            // console.log("inserting testSwNames in sw collection");
            Be.Db.swDoc.db.collections.swdbCollection.insert(testSwData,
              (swDocInsertErr, swDocRecords) => {
                // console.log("inserting testInstData in installations collection");
                InstBe.InstDb.instDoc.db.collections.instCollection.insert(testInstData,
                  (instInsertErr, instRecords) => {
                    done();
                  });
              });
          });
      });
  }

  public clearTestCollections(done) {
    // console.log("Cleaning up...");
    // console.log("Dropping installation collections...");
    InstBe.InstDb.instDoc.db.collections.instCollection.drop((err) => {
      // chromeDriver.quit();
      // console.log("Dropping swdb collections...");
      Be.Db.swDoc.db.collections.swdbCollection.drop((swDocDropErr) => {
          done();
      });
    });
  }
}
