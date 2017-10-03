/**
 * Data model to save arbitrary update history for a document.
 *
 * A plugin is provided to easily add update history to a document.
 *
 * Adapted from the original design by Dong Liu
 */
import * as dbg from 'debug';
import * as mongoose from 'mongoose';

import * as log from './logging';
import * as models from './models';

type Schema = mongoose.Schema;
type ObjectId = mongoose.Types.ObjectId;

export interface IPath {
  name: string;
  value: object;
};

export interface IUpdate {
    at: Date;
    by: string;
    ref: string;
    rid: ObjectId;
    paths: IPath[];
}

export interface IHistory {
  history: {
    updates?: Update[];
    updatedAt: Date;
    updatedBy: string;
    updateIds: ObjectId[];
  };
}

export type Update = IUpdate & mongoose.Document;

export interface Document<T extends Document<T>> extends mongoose.Document, IHistory {
  saveWithHistory(by: string): Promise<T>;
  populateUpdates(): Promise<void>;
};

export interface Model<T extends Document<T>> extends mongoose.Model<T> {
  findByIdWithHistory(id: string | number | ObjectId): Promise<T | null>;
  findOneWithHistory(conditions?: object): Promise<T | null>;
};

export interface HistoryOptions {
  watchAll?: boolean;
  pathsToWatch?: string[];
  deduplicate?: boolean;
};

const debug = dbg('webapp:history');

const Schema = mongoose.Schema;
const Mixed = Schema.Types.Mixed;
const ObjectId = Schema.Types.ObjectId;

/**********
 * name: the property of an object
 * value: the change-to value of the property
 **********/
const pathSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Mixed,
  },
});


/**********
 * at: the date of the changes
 * by: the author of the changes
 * ref: the name of the collection
 * rid: the id of the document
 * paths: the array of updates
 **********/
const updateSchema = new Schema({
  at: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  by: {
    type: String,
    required: true,
  },
  ref: {
    type: String,
    required: true,
  },
  rid: {
    type: ObjectId,
    refPath: 'ref',
    required: true,
  },
  paths: {
    type: [pathSchema],
  },
});

// Note the collection name is explicitly specified for this model.
export const Update = mongoose.model<Update>('Update', updateSchema, 'history');

const historySchema = new Schema({
  updatedAt: {
    type: Date,
    required: true,
  },
  updatedBy: {
    type: String,
    required: true,
  },
  updateIds: [{
    type: ObjectId,
    ref: Update.modelName,
  }],
});

/**
 * Wrapper around the Mongoose model() method that adds history
 * support and then casts the resulting model to the correct type.
 * This keeps the cast isolated to this method rather then spread
 * throughout the source code.
 *
 * Note: the SchemaType.schama property is not officially supported.
 */
export function model<T extends Document<T>>(name: string, schema: Schema, collection?: string): Model<T> {
  const type = schema.path('history');
  if (!type) {
    debug('Path \'history\' not found, adding history support now');
    addHistory(schema);
  } else if ((<any> type).schema !== historySchema) {
    throw new Error('Path \'history\' does not have the expected schema');
  }
  return <Model<T>> mongoose.model<T>(name, schema, collection);
};

/**
 * Helper to register hisitory plugin with the specified schema.
 *
 * This method provides type safety for the options unlike Schema@plugin() method.
 */
export function addHistory<T extends Document<T>>(schema: Schema, options?: HistoryOptions) {
  const opts: any = {
    deduplicate: true,
  };
  if (options) {
    opts.watchAll = options.watchAll;
    opts.pathsToWatch = options.pathsToWatch;
    if (options.deduplicate === false) {
      opts.deduplicate = false;
    }
  }
  schema.plugin(historyPlugin, opts);
}

/**
 * Mongoose plugin to support document update history.
 *
 * @param {Schema} schema
 * @param {Object} options
 */
export function historyPlugin<T extends Document<T>>(schema: Schema, options?: HistoryOptions) {
  const pathsToIgnore = ['_id', 'history'];
  const pathsToWatch: string[] = [];

  if (!options || options.watchAll === true) {
    schema.eachPath((path, type) => {
      if (!pathsToIgnore.includes(path) && !pathsToWatch.includes(path)) {
        pathsToWatch.push(path);
      }
    });
  } else {
    const paths = options.pathsToWatch;
    if (paths) {
      for (let path of paths) {
        if (!pathsToIgnore.includes(path) && !pathsToWatch.includes(path) && schema.path(path)) {
          pathsToWatch.push(path);
        }
      }
    }
  }

  schema.add({
    history: {
      type: historySchema,
      required: false,
    },
  });

  /**
   * Model instance method to save with history. A document should use #set()
   * to update in order to get the modified check working properly for
   * embedded document. Otherwise, explicitly #markModified(path) to mark
   * modified of the path.
   *
   * @param  {String}  userid the user making this update
   */
  schema.method('saveWithHistory', function (this: T, updatedBy: string): Promise<T> {
    if (!updatedBy) {
      return Promise.reject(new Error('UpdatedBy argument is required'));
    }

    if (!this.isModified()) {
      debug('Document not modified, so just save the document');
      return this.save();
    }

    let paths: IPath[] = [];

    if (debug.enabled) {
      debug('Paths to watch: [%s]', pathsToWatch.join(','));
    }

    for (let name of pathsToWatch) {
      if ((this.isNew && this.get(name)) || this.isModified(name)) {
        const value = this.get(name);
        paths.push({
          name: name,
          value: value,
        });
        debug('Path \'%s\' is modified: %s', name, value);
      } else {
        debug('Path \'%s\' is not modified', name);
      }
    }

    if (paths.length === 0) {
      debug('No modified paths, so just save the document');
      return this.save();
    }

    const updatedAt = new Date();

    const doc: IUpdate = {
      at: updatedAt,
      by: updatedBy,
      ref: models.getModelName(this),
      rid: this._id,
      paths: paths,
    };

    return Update.create(doc).then((update) => {
      debug('Update saved ID: %s', update.id);
      if (this.history) {
        this.history.updatedAt = updatedAt;
        this.history.updatedBy = updatedBy;
        this.history.updateIds.push(update._id);
      } else {
        this.history = {
          updatedAt: updatedAt,
          updatedBy: updatedBy,
          updateIds: [ update._id ],
        };
      }
      if (this.history.updates) {
        this.history.updates.push(update);
      }
      return this.save();
    });
  });

  /**
   * Populate the updates for this document.
   */
  schema.method('populateUpdates', function (this: T): Promise<void> {
    if (debug.enabled) {
      debug('Populate update IDs: [%s]', this.history.updateIds.join(', '));
    }
    return Update.find({ _id: { $in: this.history.updateIds }}).exec().then((updates) => {
      const ordered: Update[] = [];
      for (let id of this.history.updateIds) {
        for (let update of updates) {
          if (id.equals(update._id)) {
            ordered.push(update);
            continue;
          }
        }
      }
      debug('Populate updates: %s', ordered.length);
      this.history.updates = ordered;
    });
  });

  /**
   * Find document and its history by ID. This method does both concurrently.
   */
  schema.static('findByIdWithHistory', function (this: Model<T>, id: string | number | ObjectId): Promise<T | null> {
    if (typeof id === 'string' || typeof id === 'number')  {
      id = mongoose.Types.ObjectId(id);
    }
    return Promise.all([
      this.findById(id).exec(),
      Update.find({ ref: this.modelName, rid: id }).exec(),
    ])
    .then(([t, updates]) => {
      if (t && t.history && t.history.updateIds && updates) {
        t.history.updates = models.pickById(updates, t.history.updateIds);
      }
      return t;
    });
  });

  /**
   * Find one document and its history. NOTE This method requires TWO database queries!
   */
  schema.static('findOneWithHistory', function (this: Model<T>, conditions?: object): Promise<T | null> {
    return this.findOne(conditions).exec().then((t) => {
      if (!t) {
        return Promise.resolve(null);
      }
      return Update.find({ ref: this.modelName, rid: t._id }).exec().then((updates) => {
        t.history.updates = models.pickById(updates, t.history.updateIds);
        return t;
      });
    });
  });

};
