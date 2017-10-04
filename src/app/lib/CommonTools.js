"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var rc = require("rc");
var swdbEnums_1 = require("../../../config/swdbEnums");
var swdbEnums_2 = require("../../../config/swdbEnums");
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
            rcw.InstStatusEnum = swdbEnums_1.InstStatusEnum;
            rcw.AreaEnum = swdbEnums_2.AreaEnum;
            return rcw;
        };
    }
    return CommonTools;
}());
exports.CommonTools = CommonTools;
