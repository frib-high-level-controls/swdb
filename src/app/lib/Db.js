"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var swdbTools = require("./CommonTools");
var Db = /** @class */ (function () {
    function Db() {
        var _this = this;
        // general function to find a request ID in a request and
        // return it, if available
        this.getReqId = function (req) {
            var id = null;
            if (req.url.match(/[^v][\da-fA-F]+$/) !== null) {
                var urlParts = req.url.split('/');
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
            var doc = new Db.swDoc(req.body);
            doc.save(function (err) {
                if (err) {
                    next(err);
                }
                else {
                    // console.log('saved: ' + JSON.stringify(doc));
                    res.location(_this.props.apiUrl + doc._id);
                    res.status(201);
                    res.send();
                }
            });
        };
        this.getDocs = function (req, res, next) {
            var id = this.getReqId(req);
            if (!id) {
                // return all
                Db.swDoc.find({}, function (err, docs) {
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
                Db.swDoc.findOne({ _id: id }, function (err, docs) {
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
            var _this = this;
            var id = this.getReqId(req);
            if (id) {
                Db.swDoc.findOne({ _id: id }, function (err, doc) {
                    if (doc) {
                        for (var prop in req.body) {
                            if (req.body.hasOwnProperty(prop)) {
                                // overwrite the record property with this, but not id
                                if (prop === '_id') {
                                    continue;
                                }
                                doc[prop] = req.body[prop];
                            }
                        }
                        doc.save(function (saveerr) {
                            if (saveerr) {
                                return next(saveerr);
                            }
                            else {
                                res.location(_this.props.apiUrl + doc._id);
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
        // return array of records given an array of ids
        this.getList = function (req, res, next) {
            var _this = this;
            var response = {};
            var objIds = req.body.map(function (id) { return id; });
            Db.swDoc.find({ _id: { $in: objIds } }, function (err, docs) {
                if (err) {
                    // console.log("err:" + JSON.stringify(err));
                    return next(err);
                }
                else {
                    var results = {};
                    for (var _i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
                        var doc = docs_1[_i];
                        _this.rec = doc;
                        results[_this.rec.id] = {
                            swName: doc.swName,
                            version: doc.version,
                            branch: doc.branch,
                        };
                    }
                    res.send(results);
                }
            });
        };
        this.deleteDoc = function (req, res, next) {
            var id = this.getReqId(req);
            // mongoose does not error if deleting something that does not exist
            Db.swDoc.findOne({ _id: id }, function (err, doc) {
                if (doc) {
                    Db.swDoc.remove({ _id: id }, function (rmerr) {
                        if (!rmerr) {
                            res.end();
                        }
                    });
                }
                else {
                    return next(err);
                }
            });
        };
        var tools = new swdbTools.CommonTools();
        // let props: any = {};
        this.props = tools.getConfiguration();
        if (!Db.schema) {
            // console.log("No db connection found, making one...");
            Db.schema = new mongoose.Schema({
                swName: { type: String, required: true },
                version: { type: String, default: '' },
                branch: { type: String, default: '' },
                desc: { type: String, default: '' },
                owner: { type: String, required: true },
                engineer: { type: String, required: false },
                levelOfCare: { type: String, enum: this.props.levelOfCareLabels, required: true },
                status: { type: String, enum: this.props.statusLabels, required: true },
                statusDate: { type: Date, required: true },
                platforms: { type: String, default: '' },
                designDescDocLoc: { type: String, default: '' },
                descDocLoc: { type: String, default: '' },
                vvProcLoc: { type: String, default: '' },
                vvResultsLoc: { type: String, default: '' },
                versionControl: { type: String, enum: this.props.rcsLabels },
                versionControlLoc: { type: String, default: '' },
                recertFreq: { type: String, default: '' },
                recertStatus: { type: String, default: '' },
                recertDate: Date,
                previous: { type: String, default: '' },
                comment: { type: String, default: '' },
            }, { emitIndexErrors: true });
            Db.schema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });
            Db.swDoc = mongoose.model('swdb', Db.schema, 'swdbCollection');
            // console.log("Connecting to mongo... " + JSON.stringify(props.mongodbUrl));
            Db.dbConnect = mongoose.connect(this.props.mongodbUrl, function (err, db) {
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
    return Db;
}());
exports.Db = Db;
