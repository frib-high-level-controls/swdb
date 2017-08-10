"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Be = require('../../lib/Db');
var be = new Be.Db();
var instBe = require("../../lib/instDb.js");
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
var props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
var testInstData = JSON.parse(fs.readFileSync('./test/misc/datafiles/instTestDataCombined.json', 'utf8'));
var testSwData = JSON.parse(fs.readFileSync('./test/misc/datafiles/swTestDataCombined.json', 'utf8'));
var testSwNames = JSON.parse(fs.readFileSync('./test/misc/datafiles/swTestNames.json', 'utf8'));
var TestTools = (function () {
    function TestTools() {
    }
    TestTools.prototype.loadTestCollectionsStandard = function (done) {
        console.log("Starting standard test db clear and reload...");
        // before we start loading data, convert _ids to ObjectIDs
        console.log("Converting ObjectIds...");
        for (var i in testSwNames) {
            if ("_id" in testSwNames[i]) {
                testSwNames[i]._id = ObjectId(testSwNames[i]._id);
            }
        }
        for (i in testSwData) {
            if ("_id" in testSwData[i]) {
                testSwData[i]._id = ObjectId(testSwData[i]._id);
            }
        }
        for (i in testInstData) {
            if ("_id" in testInstData[i]) {
                testInstData[i]._id = ObjectId(testInstData[i]._id);
            }
        }
        console.log("Dropping installation collections...");
        instBe.instDoc.db.collections.instCollection.drop(function (err) {
            console.log("Dropping sw collections...");
            Be.Db.swDoc.db.collections.swdbCollection.drop(function (err) {
                console.log("Dropping swNames collections...");
                Be.Db.swDoc.db.collections.swNamesProp.drop(function (err) {
                    console.log("inserting testSwNames in sw collection");
                    Be.Db.swNamesDoc.db.collections.swNamesProp.insert(testSwNames, function (err, records) {
                        console.log("inserting testSwData in installations collection");
                        Be.Db.swDoc.db.collections.swdbCollection.insert(testSwData, function (err, records) {
                            console.log("inserting testInstData in installations collection");
                            instBe.instDoc.db.collections.instCollection.insert(testInstData, function (err, records) {
                                done();
                            });
                        });
                    });
                });
            });
        });
    };
    TestTools.prototype.clearTestCollections = function (done) {
        console.log("Cleaning up...");
        console.log("Dropping installation collections...");
        instBe.instDoc.db.collections.instCollection.drop(function (err) {
            // chromeDriver.quit();
            console.log("Dropping swdb collections...");
            Be.Db.swDoc.db.collections.swdbCollection.drop(function (err) {
                console.log("Dropping swdbNames collections...");
                Be.Db.swDoc.db.collections.swNamesProp.drop(function (err) {
                    done();
                });
            });
        });
    };
    return TestTools;
}());
exports.TestTools = TestTools;
