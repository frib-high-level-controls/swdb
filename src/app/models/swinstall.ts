/**
 * Model to represent Software or Firmware.
 */
import { isString } from 'lodash';
import * as mongoose from 'mongoose';

import * as history from '../shared/history';

import { MODEL_NAME as SOFTWARE_MODEL_NAME } from './software';

type ObjectId = mongoose.Types.ObjectId;

export enum Status {
  RDY_INST = 'RDY_INST',
  RDY_VER = 'RDY_VER',
  RDY_BEAM = 'RDY_BEAM',
  RET = 'RET',
}

export interface ISWInstall {
  _id: any;
  host: string;
  name: string;
  area: string[];
  status: string;
  statusDate: Date;
  software: ObjectId;
  vvResultsLoc: string[];
  vvApprovalDate?: Date;
  drr: string;
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
    trim: true,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
    // Using 'require: true' on fields of String type
    // causes empty strings ('') to raise a validation
    // error. Use the following custom validator instead.
    validate: isString,
  },
  area: {
    type: [String],
    default: [],
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
  software: {
    type: ObjectId,
    ref: SOFTWARE_MODEL_NAME,
    required: true,
  },
  vvResultsLoc: {
    type: [String],
    default: [],
    required: true,
  },
  vvApprovalDate: {
    type: Date,
    required: false,
  },
  drr: {
    type: String,
    default: '',
    validate: isString,
  },
}, {
  emitIndexErrors: true,
});

swInstallSchema.index({ host: 1, name: 1, software: 1 }, { unique: true });

history.addHistory(swInstallSchema, {
  watchAll: true,
});

export const SWInstall = history.model<SWInstall>('inst', swInstallSchema, 'instCollection');
