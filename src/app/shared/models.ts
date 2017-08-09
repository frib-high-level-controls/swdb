/*
 * Shared Mongoose model utilities
 */
import mongoose = require('mongoose');

export type ObjectId = mongoose.Types.ObjectId;

/**
 * Escape Regular Expression special characters in the given string.
 */
export function escapeRegExp(value: string): string {
  // This snippet for escaping regex special characters is copied from MDN
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Construct a RegExp that matches the given value for the entire input.
 */
export function matchAll(value: string, flags?: string): RegExp {
  return new RegExp('^' + escapeRegExp(value) + '$', flags);
};

/**
 * Construct a RegExp that matches the given value at the start of the input.
 */
export function matchStart(value: string, flags?: string): RegExp {
  return new RegExp('^' + escapeRegExp(value), flags);
};

/**
 * Construct a RegExp that matches the given value at the end of the input.
 */
export function matchEnd(value: string, flags?: string): RegExp {
  return new RegExp(escapeRegExp(value) + '$', flags);
};

/*
 * Map array of documents by IDs
 */
export function MapById<T extends mongoose.Document>(docs: T[]): Map<string, T> {
  let m = new Map<string, T>();
  for (let d of docs) {
    if (d.id) {
      m.set(d.id, d);
    }
  }
  return m;
}

/*
 * Pick documents by the given ID or array of IDs
 */
export function pickById<T extends mongoose.Document>(docs: T[], ids: string): T | undefined;
export function pickById<T extends mongoose.Document>(docs: T[], ids: ObjectId): T | undefined;
export function pickById<T extends mongoose.Document>(docs: T[], ids: string[]): T[];
export function pickById<T extends mongoose.Document>(docs: T[], ids: ObjectId[]): T[];
export function pickById<T extends mongoose.Document>(docs: T[], ids: string | ObjectId | string[] | ObjectId[]) {
  if (Array.isArray(ids)) {
    let a = new Array<T>();
    for (let id of ids) {
      for (let doc of docs) {
        if (doc._id && doc._id.equals(id)) {
          a.push(doc);
          break;
        }
      }
    }
    return a;
  }
  for (let doc of docs) {
    if (doc._id && doc._id.equals(ids)) {
      return doc;
    }
  }
  return;
}

/*
 * Provides a typesafe method to access the model of the given document.
 */
export function getModel<T extends mongoose.Document>(doc: T): mongoose.Model<T> {
  return <mongoose.Model<T>> doc.constructor;
};

/*
 * Provides the typesafe method to access the model name of the given document.
 */
export function getModelName<T extends mongoose.Document>(doc: T): string {
  return getModel(doc).modelName;
};

/*
 * Save the list of documents
 */
export function saveAll<T extends mongoose.Document>(docs: IterableIterator<T>): Promise<T[]> {
  let prms = new Array<Promise<T>>();
  for (let doc of docs) {
    prms.push(doc.save());
  }
  return Promise.all(prms);
};
