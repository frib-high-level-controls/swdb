"use strict";
exports.__esModule = true;
var ObjectId = require('mongodb').ObjectID;
var CommonTools = require("../../../app/lib/CommonTools");
var Be = require("../../../app/lib/Db");
var be = new Be.Db();
var InstBe = require("../../../app/lib/instDb.js");
var instBe = new InstBe.InstDb();
var tools = new CommonTools.CommonTools();
var props = tools.getConfiguration();
var fs = require("fs");
// const testInstData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/instTestDataCombined.json', 'utf8'));
// const testSwData = JSON.parse(fs.readFileSync('../apptest/misc/datafiles/swTestDataCombined.json', 'utf8'));
var TestTools = /** @class */ (function () {
    function TestTools() {
    }
    TestTools.prototype.loadTestCollectionsStandard = function (done, swFile, instFile) {
        var testInstData = JSON.parse(fs.readFileSync(instFile, 'utf-8'));
        var testSwData = JSON.parse(fs.readFileSync(swFile, 'utf8'));
        // console.log("Starting standard test db clear and reload...");
        // before we start loading data, convert _ids to ObjectIDs
        // console.log("Converting ObjectIds...");
        for (var i in testSwData) {
            if ('_id' in testSwData[i]) {
                testSwData[i]._id = ObjectId(testSwData[i]._id);
            }
        }
        for (var i in testInstData) {
            if ('_id' in testInstData[i]) {
                testInstData[i]._id = ObjectId(testInstData[i]._id);
            }
        }
        // console.log("Dropping installation collections...");
        InstBe.InstDb.instDoc.db.collections.instCollection.drop(function (err) {
            // console.log("Dropping sw collections...");
            Be.Db.swDoc.db.collections.swdbCollection.drop(function (swDocDropErr) {
                // console.log("inserting testSwNames in sw collection");
                Be.Db.swDoc.db.collections.swdbCollection.insert(testSwData, function (swDocInsertErr, swDocRecords) {
                    // console.log("inserting testInstData in installations collection");
                    InstBe.InstDb.instDoc.db.collections.instCollection.insert(testInstData, function (instInsertErr, instRecords) {
                        if (instInsertErr) {
                            console.log(instInsertErr);
                        }
                        done();
                    });
                });
            });
        });
    };
    TestTools.prototype.clearTestCollections = function (done) {
        // console.log("Cleaning up...");
        // console.log("Dropping installation collections...");
        InstBe.InstDb.instDoc.db.collections.instCollection.drop(function (err) {
            // chromeDriver.quit();
            // console.log("Dropping swdb collections...");
            Be.Db.swDoc.db.collections.swdbCollection.drop(function (swDocDropErr) {
                done();
            });
        });
    };
    return TestTools;
}());
exports.TestTools = TestTools;
