/**
 * Data model to save arbitrary update history for a document.
 *
 * A plugin is provided to easily add update history to a document.
 *
 * Adapted from the original design by Dong Liu
 */
import * as dbg from 'debug';
import * as mongoose from 'mongoose';

import * as models from './models';

type QR<T> = T[] | T | null; // ie QueryResult<T>
type Schema = mongoose.Schema;
type ObjectId = mongoose.Types.ObjectId;

export interface IPath {
  name: string;
  value: object;
}

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
    updatedAt?: Date;
    updatedBy?: string;
    updateIds: ObjectId[];
  };
}

export type Update = IUpdate & mongoose.Document;

export type DocumentQuery<T, DocType extends Document<DocType>> = mongoose.DocumentQuery<T, DocType>;

export interface Document<T extends Document<T>> extends mongoose.Document, IHistory {
  saveWithHistory(by: string): Promise<T>;
  populateUpdates(): Promise<void>;
}

export interface Model<T extends Document<T>> extends mongoose.Model<T> {
  findByIdWithHistory(id: string | number | ObjectId): Promise<T | null>;
  findOneWithHistory(conditions?: object): Promise<T | null>;
  findWithHistory(conditions?: object): Promise<T[]>;
  execWithHistory(this: Model<T>, query: mongoose.DocumentQuery<T | null, T>): Promise<T | null>;
  execWithHistory(this: Model<T>, query: mongoose.DocumentQuery<T[], T>): Promise<T[]>;
}

export interface HistoryOptions {
  watchAll?: boolean;
  pathsToWatch?: string[];
  deduplicate?: boolean;
}

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
}, {
  usePushEach: true,
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
}, {
  usePushEach: true,
});

// Note the collection name is explicitly specified for this model.
export const Update = mongoose.model<Update>('Update', updateSchema, 'history');

const historySchema = new Schema({
  updatedAt: {
    type: Date,
    required: false,
  },
  updatedBy: {
    type: String,
    required: false,
  },
  updateIds: [{
    type: ObjectId,
    ref: Update.modelName,
  }],
}, {
  usePushEach: true,
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
  } else if ((type as any).schema !== historySchema) {
    throw new Error('Path \'history\' does not have the expected schema');
  }
  return mongoose.model<Document<T>>(name, schema, collection) as Model<T>;
}

/**
 * Helper to register hisitory plugin with the specified schema.
 *
 * This method provides type safety for the options unlike Schema@plugin() method.
 */
export function addHistory(schema: Schema, options?: HistoryOptions) {
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
      for (const path of paths) {
        if (!pathsToIgnore.includes(path) && !pathsToWatch.includes(path) && schema.path(path)) {
          pathsToWatch.push(path);
        }
      }
    }
  }

  schema.add({
    history: {
      type: historySchema,
      default: { updateIds: [] },
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
  schema.method('saveWithHistory', function(this: T, updatedBy: string): Promise<T> {
    if (!updatedBy) {
      return Promise.reject(new Error('UpdatedBy argument is required'));
    }

    if (!this.isModified()) {
      debug('Document not modified, so just save the document');
      return this.save();
    }

    const paths: IPath[] = [];

    if (debug.enabled) {
      debug('Paths to watch: [%s]', pathsToWatch.join(','));
    }

    for (const name of pathsToWatch) {
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
        // Using 'updateIds.push(update._id)' causes duplicate IDs when
        // calling saveWithHistory() repeatedly on a model (v4.13.11)!
        this.history.updateIds = this.history.updateIds.concat(update._id);
      } else {
        // TODO: Consider removing this branch
        //       as this.history *should* be
        //       initialized by the schema.
        this.history = {
          updatedAt: updatedAt,
          updatedBy: updatedBy,
          updateIds: [ update._id ],
        };
      }
      if (this.history.updates) {
        this.history.updates.push(update);
      } else if (this.history.updateIds.length === 1) {
        this.history.updates = [ update ];
      }
      return this.save();
    });
  });

  /**
   * Populate the updates for this document.
   */
  schema.method('populateUpdates', function(this: T): Promise<void> {
    return Update.find({ _id: { $in: this.history.updateIds }}).exec().then((updates) => {
      this.history.updates = models.pickById(updates, this.history.updateIds);
    });
  });

  /**
   * Find document and its history by ID. This method does both concurrently!
   */
  schema.static('findByIdWithHistory', function(this: Model<T>, id: string | number | ObjectId): Promise<T | null> {
    return Promise.all([
      this.findById(id).exec(),
      Update.find({ ref: this.modelName, rid: id }).exec(),
    ])
    .then(([doc, updates]) => {
      if (doc && doc.history && doc.history.updateIds && updates) {
        doc.history.updates = models.pickById(updates, doc.history.updateIds);
      }
      return doc;
    });
  });

  /**
   * Find document and its history. NOTE This method requires TWO database queries!
   */
  schema.static('findOneWithHistory', function(this: Model<T>, conditions?: object): Promise<T | null> {
    return this.execWithHistory(this.findOne(conditions));
  });

  /**
   * Find documents and their history. NOTE This method requires TWO database queries!
   */
  schema.static('findWithHistory', function(this: Model<T>, conditions?: object): Promise<T[]> {
    return this.execWithHistory(this.find(conditions || {}));
  });

  /**
   * Execute the query and then the document history. NOTE This method requires TWO database queries!
   */
  schema.static('execWithHistory', function(this: Model<T>, query: DocumentQuery<QR<T>, T>): Promise<QR<T>> {
    return query.exec().then((docs) => {
      if (!docs) {
        return null;
      }
      let ids: ObjectId[] = [];
      if (Array.isArray(docs)) {
        for (const doc of docs) {
          ids = ids.concat(doc.history.updateIds);
        }
      } else {
        ids = ids.concat(docs.history.updateIds);
      }
      return Update.find({_id: { $in: ids }}).exec().then((updates) => {
        if (!docs) {
          return null;
        }
        if (Array.isArray(docs)) {
          for (const doc of docs) {
            doc.history.updates = models.pickById(updates, doc.history.updateIds);
          }
        } else {
          docs.history.updates = models.pickById(updates, docs.history.updateIds);
        }
        return docs;
      });
    });
  });

}
