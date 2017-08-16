"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var rc = require("rc");
var CommonTools = (function () {
    function CommonTools() {
        this.getConfiguration = function () {
            // acquire configuration
            var props = null;
            if (fs.existsSync("/home/deployer/swdb/config/swdbrc")) {
                var stripJSON = require("strip-json-comments");
                props = JSON.parse(stripJSON(fs.readFileSync("/home/deployer/swdb/config/swdbrc", "utf8")));
            }
            var rcw = rc("swdb", props);
            return rcw;
        };
    }
    return CommonTools;
}());
exports.CommonTools = CommonTools;
