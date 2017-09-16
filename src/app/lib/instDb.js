"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var instTools = require("./instLib.js");
var CommonTools = require("./CommonTools");
var InstDb = /** @class */ (function () {
    function InstDb() {
        var _this = this;
        this.findByName = function (searchName) {
            InstDb.instDoc.findOne({ swName: searchName }, function (err, doc) {
                return (doc);
            });
        };
        this.findById = function (searchId) {
            InstDb.instDoc.findOne({ _id: searchId }, function (err, doc) {
                return (doc);
            });
        };
        // Create a new record in the backend storage
        this.createDoc = function (req, res, next) {
            var doc = new InstDb.instDoc(req.body);
            doc.save(function (err) {
                if (err) {
                    next(err);
                }
                else {
                    res.location(_this.props.instApiUrl + doc._id);
                    res.status(201);
                    res.send();
                }
            });
        };
        this.getDocs = function (req, res, next) {
            var id = instTools.getReqId(req);
            if (!id) {
                // return all
                InstDb.instDoc.find({}, function (err, docs) {
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
                InstDb.instDoc.findOne({ _id: id }, function (err, docs) {
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
            var id = instTools.getReqId(req);
            if (id) {
                var doc = InstDb.instDoc.findOne({ _id: id }, function (err, founddoc) {
                    if (founddoc) {
                        for (var prop in req.body) {
                            if (req.body.hasOwnProperty(prop)) {
                                // overwrite the record property with this, but not id
                                if (prop === '_id') {
                                    continue;
                                }
                                founddoc[prop] = req.body[prop];
                            }
                        }
                        founddoc.save(function (saveerr) {
                            if (saveerr) {
                                return next(saveerr);
                            }
                            else {
                                res.location(_this.props.instApiUrl + founddoc._id);
                                res.end();
                            }
                        });
                    }
                    else {
                        return next(new Error('Record not found'));
                    }
                });
            }
            else {
                next(new Error('Record not found'));
            }
        };
        this.deleteDoc = function (req, res, next) {
            var id = instTools.getReqId(req);
            // mongoose does not error if deleting something that does not exist
            InstDb.instDoc.findOne({ _id: id }, function (err, doc) {
                if (doc) {
                    exports.instDoc.remove({ _id: id }, function (rmerr) {
                        if (!rmerr) {
                            res.end();
                        }
                        else {
                            next(new Error('Record not found'));
                        }
                    });
                }
                else {
                    return next(err);
                }
            });
        };
        var ctools = new CommonTools.CommonTools();
        this.props = ctools.getConfiguration();
        if (!InstDb.instSchema) {
            InstDb.instSchema = new mongoose.Schema({
                host: { type: String, required: true },
                area: { type: String, enum: this.props.areaEnums, required: true },
                slots: [String],
                status: { type: String, enum: this.props.instStatusEnums, required: true },
                statusDate: { type: Date, required: true },
                software: { type: String, required: true },
                vvResultsLoc: String,
                drrs: String,
            }, { emitIndexErrors: true });
            InstDb.instSchema.index({ host: 1, software: 1 }, { unique: true });
            InstDb.instDoc = mongoose.model('inst', InstDb.instSchema, 'instCollection');
            InstDb.dbConnect = mongoose.connect(this.props.mongodbUrl, function (err, db) {
                if (!err) {
                    // console.log("connected to mongo... " + JSON.stringify(this.props.mongodbUrl);
                    // console.log("connected to mongo... " + JSON.stringify(props.mongodbUrl));
                }
                else {
                    // console.log("Error: " + err);
                }
            });
        }
    }
    return InstDb;
}());
exports.InstDb = InstDb;
