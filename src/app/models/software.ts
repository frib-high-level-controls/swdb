/**
 * Model to represent Software or Firmware.
 */
import { isString } from 'lodash';
import * as mongoose from 'mongoose';

import * as history from '../shared/history';

type ObjectId = mongoose.Types.ObjectId;

export enum CareLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum Status {
  DEVEL = 'DEVEL',
  RDY_TEST = 'RDY_TEST',
  RDY_INST = 'RDY_INST',
  DEP = 'DEP',
}

export enum VersionControlSystem {
  GIT = 'GIT',
  AC =  'AC',
  FS = 'FS',
  DEB = 'DEB',
  OTHER = 'OTHER',
}

export type  VCS = VersionControlSystem;
export const VCS = VersionControlSystem;

export interface ISoftware extends history.IHistory {
  _id: any;
  name: string;
  desc: string;
  branch: string;
  version: string;
  owner: string;
  engineer: string;
  levelOfCare: string;
  status: string;
  statusDate: Date;
  platforms: string;
  descDocLoc: string;
  designDescDocLoc: string;
  vvProcLoc: string[];
  vvResultsLoc: string[];
  versionControl: string;
  versionControlLoc: string;
  previous?: ObjectId;
  comment: string;
}

export interface Software extends ISoftware, history.Document<Software> {
  // no additional methods
}

export const CARE_LEVELS: CareLevel[] = [
  CareLevel.LOW,
  CareLevel.MEDIUM,
  CareLevel.HIGH,
];

export const STATUSES: Status[] = [
  Status.DEVEL,
  Status.RDY_TEST,
  Status.RDY_INST,
  Status.DEP,
];

export const VERSION_CONTROL_SYSTEMS: VCS[] = [
  VCS.GIT,
  VCS.AC,
  VCS.FS,
  VCS.DEB,
  VCS.OTHER,
];

const MODEL_NAME = 'swdb';

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const softwareSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    default: '',
    // Using 'require: true' on fields of String type
    // causes empty strings ('') to raise a validation
    // error. Use the following custom validator instead.
    validate: isString,
  },
  branch: {
    type: String,
    default: '',
    validate: isString,
  },
  version: {
    type: String,
    default: '',
    validate: isString,
  },
  owner: {
    type: String,
    required: true,
  },
  engineer: {
    type: String,
    default: '',
    validate: isString,
  },
  levelOfCare: {
    type: String,
    enum: CARE_LEVELS,
    required: true,
  },
  status: {
    type: String,
    enum: STATUSES,
    required: true,
  },
  statusDate: {
    type: Date,
    required: true,
  },
  platforms: {
    type: String,
    default: '',
    validate: isString,
  },
  designDescDocLoc: {
    type: String,
    default: '',
    validate: isString,
  },
  descDocLoc: {
    type: String,
    default: '',
    validate: isString,
  },
  vvProcLoc: {
    type: [String],
    default: [],
    required: true,
  },
  vvResultsLoc: {
    type: [String],
    default: [],
    required: true,
  },
  versionControl: {
    type: String,
    enum: [''].concat(VERSION_CONTROL_SYSTEMS),
    validate: isString,
  },
  versionControlLoc: {
    type: String,
    default: '',
    validate: isString,
  },
  previous: {
    type: ObjectId,
    ref: MODEL_NAME,
    default: null,
  },
  comment: {
    type: String,
    default: '',
    validate: isString,
  },
}, {
  emitIndexErrors: true,
});

softwareSchema.index({ name: 1, version: 1, branch: 1 }, { unique: true });

history.addHistory(softwareSchema, {
  watchAll: true,
});

export const Software = history.model<Software>(MODEL_NAME, softwareSchema, 'swdbCollection');
