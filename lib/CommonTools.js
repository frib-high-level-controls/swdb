"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rc = require("rc");
var fs = require("fs");
var CommonTools = (function () {
    function CommonTools() {
        this.getConfiguration = function () {
            // acquire configuration
            var props = {};
            if (fs.existsSync('./config/swdbrc')) {
                var stripJSON = require('strip-json-comments');
                props = JSON.parse(stripJSON(fs.readFileSync('./config/swdbrc', 'utf8')));
            }
            var rcw = rc("swdb", props);
            return rcw;
        };
    }
    return CommonTools;
}());
exports.CommonTools = CommonTools;
