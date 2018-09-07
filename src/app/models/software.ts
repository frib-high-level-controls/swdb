/**
 * Model to represent Software or Firmware.
 */
import * as mongoose from 'mongoose';

import * as history from '../shared/history';

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
  swName: string;
  version?: string;
  branch?: string;
  desc?: string;
  owner: string;
  engineer?: string;
  levelOfCare: string;
  status: string;
  statusDate: Date;
  platforms?: string;
  designDescDocLoc?: string;
  descDocLoc?: string;
  vvProcLoc?: string[];
  vvResultsLoc?: string[];
  versionControl?: string;
  versionControlLoc?: string;
  previous?: string;
  comment?: string;
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

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const softwareSchema = new Schema({
  swName: {
    type: String,
    required: true,
  },
  version: {
    type: String,
  },
  branch: {
    type: String,
  },
  desc: {
    type: String,
  },
  owner: {
    type: String,
    required: true,
  },
  engineer: {
    type: String,
    required: false,
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
  },
  designDescDocLoc: {
    type: String,
  },
  descDocLoc: {
    type: String,
  },
  vvProcLoc: {
    type: [String],
  },
  vvResultsLoc: {
    type: [String],
  },
  versionControl: {
    type: String,
    enum: VERSION_CONTROL_SYSTEMS,
  },
  versionControlLoc: {
    type: String,
  },
  previous: {
    type: ObjectId,
  },
  comment: {
    type: String,
  },
}, {
  emitIndexErrors: true,
});

softwareSchema.index({ swName: 1, version: 1, branch: 1 }, { unique: true });

history.addHistory(softwareSchema, {
  watchAll: true,
});

export const Software = history.model<Software>('swdb', softwareSchema, 'swdbCollection');
