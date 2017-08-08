"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var fs = require("fs");
var db = (function () {
    function db() {
        var _this = this;
        // import mongoose = module('mongoose');
        // var tools = require('./swdblib.js');
        // import mongoose = require('mongoose');
        // var fs = require('fs');
        // var util = require('util');
        // var ObjectId = require('mongodb').ObjectID;
        this.props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
        // general function to find a request ID in a request and
        // return it, if available
        this.getReqId = function (req) {
            var id = null;
            if (req.url.match(/[^v][\da-fA-F]+$/) !== null) {
                var urlParts = req.url.split("/");
                id = urlParts[urlParts.length - 1];
                return id;
            }
            else {
                return null;
            }
        };
        this.findByName = function (searchName) {
            exports.swDoc.findOne({ swName: searchName }, function (err, doc) {
                return (doc);
            });
        };
        this.findById = function (searchId) {
            exports.swDoc.findOne({ _id: searchId }, function (err, doc) {
                return (doc);
            });
        };
        // Create a new record in the backend storage
        this.createDoc = function (req, res, next) {
            var doc = new exports.swDoc(req.body);
            //console.log(JSON.stringify(req.body,null,2));
            doc.save(function (err) {
                if (err) {
                    next(err);
                }
                else {
                    res.location('/swdb/v1/' + req.body._id);
                    res.status(201);
                    res.send();
                }
            });
        };
        this.getDocs = function (req, res, next) {
            var id = this.getReqId(req);
            if (!id) {
                // return all
                this.swDoc.find({}, function (err, docs) {
                    if (!err) {
                        res.send(docs);
                    }
                    else {
                        next(err);
                    }
                });
            }
            else {
                // return specified item`
                this.swDoc.findOne({ '_id': id }, function (err, docs) {
                    if (!err) {
                        res.send(docs);
                    }
                    else {
                        next(err);
                    }
                });
            }
        };
        this.updateDoc = function (req, res, next) {
            var id = this.getReqId(req);
            if (id) {
                var doc = this.swDoc.findOne({ "_id": id }, function (err, doc) {
                    if (doc) {
                        for (var prop in req.body) {
                            if (req.body.hasOwnProperty(prop)) {
                                // overwrite the record property with this, but not id
                                if (prop === "_id") {
                                    continue;
                                }
                                doc[prop] = req.body[prop];
                            }
                        }
                        //console.log(JSON.stringify(req.body,null,2));
                        doc.save(function (err) {
                            if (err) {
                                return next(err);
                            }
                            else {
                                res.end();
                            }
                        });
                    }
                    else {
                        return next(new Error("Record not found"));
                    }
                });
            }
            else {
                next(new Error("Record not found"));
            }
        };
        // return array of records given an array of ids
        this.getList = function (req, res, next) {
            var response = {};
            var obj_ids = req.body.map(function (id) { return id; });
            this.swDoc.find({}, function (err, docs) {
            });
            this.swDoc.find({ _id: { $in: obj_ids } }, function (err, docs) {
                if (err) {
                    console.log("err:" + JSON.stringify(err));
                    return next(err);
                }
                else {
                    var results = {};
                    //console.log("found docs:"+ JSON.stringify(docs));
                    for (var idx = 0; idx < docs.length; idx++) {
                        this.rec = docs[idx];
                        results[this.rec.id] = {
                            "swName": docs[idx].swName,
                            "version": docs[idx].version,
                            "branch": docs[idx].branch
                        };
                    }
                    res.send(results);
                }
            });
        };
        this.deleteDoc = function (req, res, next) {
            var id = this.getReqId(req);
            // mongoose does not error if deleting something that does not exist
            this.swDoc.findOne({ "_id": id }, function (err, doc) {
                if (doc) {
                    this.swDoc.remove({ '_id': id }, function (err) {
                        if (!err) {
                            res.end();
                        }
                        else {
                        }
                    });
                }
                else {
                    return next(err);
                }
            });
        };
        this.schema = new mongoose.Schema({
            //id: {type: String, required: true, unique: true},
            swName: { type: String, required: true },
            version: String,
            branch: String,
            desc: String,
            owner: { type: String, required: true },
            engineer: { type: String, required: false },
            levelOfCare: { type: String, enum: this.props.levelOfCareEnums, required: true },
            status: { type: String, enum: this.props.statusEnums, required: true },
            statusDate: { type: Date, required: true },
            platforms: String,
            designDescDocLoc: String,
            descDocLoc: String,
            vvProcLoc: String,
            vvResultsLoc: String,
            versionControl: { type: String, enum: this.props.rcsEnums },
            versionControlLoc: String,
            recertFreq: String,
            recertStatus: String,
            recertDate: Date,
            previous: String,
            comment: String
        }, { emitIndexErrors: true });
        this.schema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });
        this.swNamesSchema = new mongoose.Schema({
            swName: String,
        }, { emitIndexErrors: true });
        this.swDoc = mongoose.model('swdb', this.schema, 'swdbCollection');
        this.swNamesDoc = mongoose.model('props', this.swNamesSchema, 'swNamesProp');
        this.dbConnect = mongoose.connect(this.props.mongodbUrl, function (err, db) {
            if (!err) {
                // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
                console.log("connected to mongo... " + JSON.stringify(_this.props.mongodbUrl));
            }
            else {
                console.log(err);
            }
        });
    }
    return db;
}());
exports.db = db;
