"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LevelOfCareEnum;
(function (LevelOfCareEnum) {
    LevelOfCareEnum[LevelOfCareEnum["NONE"] = 0] = "NONE";
    LevelOfCareEnum[LevelOfCareEnum["LOW"] = 1] = "LOW";
    LevelOfCareEnum[LevelOfCareEnum["MEDIUM"] = 2] = "MEDIUM";
    LevelOfCareEnum[LevelOfCareEnum["HIGH"] = 3] = "HIGH";
    LevelOfCareEnum[LevelOfCareEnum["SAFETY"] = 4] = "SAFETY";
})(LevelOfCareEnum = exports.LevelOfCareEnum || (exports.LevelOfCareEnum = {}));
var StatusEnum;
(function (StatusEnum) {
    StatusEnum[StatusEnum["DEVEL"] = 0] = "DEVEL";
    StatusEnum[StatusEnum["RDY_INSTALL"] = 1] = "RDY_INSTALL";
    StatusEnum[StatusEnum["RDY_INT_TEST"] = 2] = "RDY_INT_TEST";
    StatusEnum[StatusEnum["RDY_BEAM"] = 3] = "RDY_BEAM";
    StatusEnum[StatusEnum["RETIRED"] = 4] = "RETIRED";
})(StatusEnum = exports.StatusEnum || (exports.StatusEnum = {}));
var InstStatusEnum;
(function (InstStatusEnum) {
    InstStatusEnum[InstStatusEnum["DEVEL"] = 0] = "DEVEL";
    InstStatusEnum[InstStatusEnum["MAINT"] = 1] = "MAINT";
    InstStatusEnum[InstStatusEnum["RDY_INSTALL"] = 2] = "RDY_INSTALL";
    InstStatusEnum[InstStatusEnum["RDY_INT_TEST"] = 3] = "RDY_INT_TEST";
    InstStatusEnum[InstStatusEnum["RDY_BEAM"] = 4] = "RDY_BEAM";
    InstStatusEnum[InstStatusEnum["DEPRECATED"] = 5] = "DEPRECATED";
})(InstStatusEnum = exports.InstStatusEnum || (exports.InstStatusEnum = {}));
var RcsEnum;
(function (RcsEnum) {
    RcsEnum[RcsEnum["Git"] = 0] = "Git";
    RcsEnum[RcsEnum["AssetCentre"] = 1] = "AssetCentre";
    RcsEnum[RcsEnum["Filesystem"] = 2] = "Filesystem";
    RcsEnum[RcsEnum["Other"] = 3] = "Other";
})(RcsEnum = exports.RcsEnum || (exports.RcsEnum = {}));
var AreaEnum;
(function (AreaEnum) {
    AreaEnum[AreaEnum["Global"] = 0] = "Global";
    AreaEnum[AreaEnum["FE"] = 1] = "FE";
    AreaEnum[AreaEnum["LS1"] = 2] = "LS1";
    AreaEnum[AreaEnum["FS1"] = 3] = "FS1";
    AreaEnum[AreaEnum["LS2"] = 4] = "LS2";
    AreaEnum[AreaEnum["FS2"] = 5] = "FS2";
    AreaEnum[AreaEnum["LS3"] = 6] = "LS3";
    AreaEnum[AreaEnum["BDS"] = 7] = "BDS";
    AreaEnum[AreaEnum["FS"] = 8] = "FS";
})(AreaEnum = exports.AreaEnum || (exports.AreaEnum = {}));
