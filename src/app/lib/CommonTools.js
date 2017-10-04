"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var rc = require("rc");
var swdbEnums_1 = require("../../../config/swdbEnums");
var swdbEnums_2 = require("../../../config/swdbEnums");
var swdbEnums_3 = require("../../../config/swdbEnums");
var swdbEnums_4 = require("../../../config/swdbEnums");
var swdbEnums_5 = require("../../../config/swdbEnums");
var CommonTools = /** @class */ (function () {
    function CommonTools() {
        this.getConfiguration = function () {
            // acquire configuration
            var props = null;
            if (fs.existsSync('/home/deployer/swdb/config/swdbrc')) {
                var stripJSON = require('strip-json-comments');
                props = JSON.parse(stripJSON(fs.readFileSync('/home/deployer/swdb/config/swdbrc', 'utf8')));
            }
            var rcw = rc('swdb', props);
            // Add the enums
            rcw.LevelOfCareEnum = swdbEnums_1.LevelOfCareEnum;
            rcw.StatusEnum = swdbEnums_2.StatusEnum;
            rcw.InstStatusEnum = swdbEnums_3.InstStatusEnum;
            rcw.RcsEnum = swdbEnums_4.RcsEnum;
            rcw.AreaEnum = swdbEnums_5.AreaEnum;
            // Add the enum labels
            rcw.levelOfCareLabels = [];
            // Go through the enums and filter names for the select labels
            for (var key in rcw.LevelOfCareEnum) {
                if (!key.match(/^\d+/)) {
                    rcw.levelOfCareLabels.push(key);
                }
            }
            rcw.statusLabels = [];
            // Go through the enums and filter names for the select labels
            for (var key in rcw.StatusEnum) {
                if (!key.match(/^\d+/)) {
                    rcw.statusLabels.push(key);
                }
            }
            rcw.instStatusLabels = [];
            // Go through the enums and filter names for the select labels
            for (var key in rcw.InstStatusEnum) {
                if (!key.match(/^\d+/)) {
                    rcw.instStatusLabels.push(key);
                }
            }
            rcw.rcsLabels = [];
            for (var key in rcw.RcsEnum) {
                if (!key.match(/^\d+/)) {
                    rcw.rcsLabels.push(key);
                }
            }
            rcw.areaLabels = [];
            for (var key in rcw.AreaEnum) {
                if (!key.match(/^\d+/)) {
                    rcw.areaLabels.push(key);
                }
            }
            return rcw;
        };
    }
    return CommonTools;
}());
exports.CommonTools = CommonTools;
