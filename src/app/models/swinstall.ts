/**
 * Model to represent Software or Firmware.
 */
import * as mongoose from 'mongoose';

import * as history from '../shared/history';


export enum Status {
  RDY_INST = 'RDY_INST',
  RDY_VER = 'RDY_VER',
  RDY_BEAM = 'RDY_BEAM',
  RET = 'RET',
}

export interface ISWInstall extends history.IHistory {
  _id: any;
  host: string;
  name?: string;
  area: string[];
  slots?: string[];
  status: string;
  statusDate: Date;
  software: string;
  vvResultsLoc?: string[];
  vvApprovalDate?: Date;
  drrs?: string;
}

export interface SWInstall extends ISWInstall, history.Document<SWInstall> {
  // no additional methods
}

export const STATUSES: Status[] = [
  Status.RDY_INST,
  Status.RDY_VER,
  Status.RDY_BEAM,
  Status.RET,
];

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

const swInstallSchema = new Schema({
  host: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  area: {
    type: [String],
    required: true,
  },
  slots: {
    type: [String],
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
  software: {
    type: ObjectId,
    required: true,
  },
  vvResultsLoc: {
    type: [String],
  },
  vvApprovalDate: {
    type: Date,
  },
  drrs: {
    type: String,
    default: '',
  },
}, {
  emitIndexErrors: true,
});

swInstallSchema.index({ host: 1, name: 1, software: 1 }, { unique: true });

history.addHistory(swInstallSchema, {
  watchAll: true,
});

export const SWInstall = history.model<SWInstall>('inst', swInstallSchema, 'instCollection');
