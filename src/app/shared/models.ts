/*
 * Shared Mongoose model utilities
 */
import mongoose = require('mongoose');

export type ObjectId = mongoose.Types.ObjectId;

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
