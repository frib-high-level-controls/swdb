"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rc = require("rc");
var swdbEnums_1 = require("../../../config/swdbEnums");
var swdbEnums_2 = require("../../../config/swdbEnums");
var swdbEnums_3 = require("../../../config/swdbEnums");
var swdbEnums_4 = require("../../../config/swdbEnums");
var swdbEnums_5 = require("../../../config/swdbEnums");
var CommonTools = /** @class */ (function () {
    function CommonTools() {
        this.getConfiguration = function () {
            return CommonTools.props;
        };
        // Only populate props the first time we instantiate.
        // Other times just return the values we already have
        if (!CommonTools.props) {
            // acquire configuration
            var rcw = rc('swdb', CommonTools.props);
            // rc module holds the requested --config file in .config
            // and the loaded files in array .configs. Make sure the 
            // requested file loaded or error
            if (!rcw.configs || (rcw.config !== rcw.configs[0])) {
                throw new Error('Config file ' + rcw.config + ' not loaded...');
            }
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
            CommonTools.props = rcw;
        }
        else {
            // we already have props loaded.
        }
    }
    return CommonTools;
}());
exports.CommonTools = CommonTools;
