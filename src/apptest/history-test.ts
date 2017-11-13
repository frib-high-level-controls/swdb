/**
 * Testing for the History model.
 */
import { AssertionError } from 'assert';

import { assert } from 'chai';
import * as mongoose from 'mongoose';

import * as history from '../app/shared/history';

import * as app from './app';

interface IModel extends history.IHistory {
  s: string;
  n: number;
  a: string[];
  e: {
    x: string;
    y: number;
  };
};

interface Model extends IModel, history.Document<Model> {}

const embeddedSchema = new mongoose.Schema({
  x: {
    type: String,
  },
  y: {
    type: Number,
  },
});

const modelSchema = new mongoose.Schema({
  s: {
    type: String,
  },
  n: {
    type: Number,
  },
  a: {
    type: [String],
  },
  e: {
    type: embeddedSchema,
  },
});

history.addHistory(modelSchema, {
   pathsToWatch: [ 's', 'n', 'a', 'e' ],
});

const Model = history.model<Model>('Model', modelSchema);

async function assertIsFound<T>(p: Promise<T | null>): Promise<T> {
  let d: T | null;
  try {
    d = await p;
  } catch (err) {
    throw new AssertionError({ message: String(err) });
  }
  if (!d) {
    throw new AssertionError({ message: 'Document not found' });
  }
  return d;
}


describe('Model History Tests', function () {

  before(async function() {
    await app.start();
    // remove all documents
    await Model.remove({}).exec();
  });

  after(async function() {
    await app.stop();
  });

  it('Create new Model', async function () {

    const m = new Model(<IModel> {
      s: 'Value0',
      n: 1,
      a: [ 'a', 'b', 'c' ],
      e: { x: 'X', y: 1 },
    });

    try {
      await m.saveWithHistory('test0');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 1);

    let c = await assertIsFound(history.Update.findById(m.history.updateIds[0]).exec());

    assert.deepEqual(c.by, 'test0');
    assert.lengthOf(c.paths, 4);

    assert.sameDeepMembers(c.paths.map((p) => p.name), [ 's', 'n', 'a', 'e']);
    for (let path of c.paths) {
      if (path.name === 's') {
        assert.deepEqual(c.paths[0].value, <any> 'Value0');
      }
      if  (path.name === 'n') {
        assert.deepEqual(path.value, <any> 1);
      }
      if (path.name === 'a') {
        assert.sameDeepOrderedMembers(<Array<object>> path.value, <any> [ 'a', 'b', 'c']);
      }
      if (path.name === 'e') {
        assert.deepEqual((<any> path.value).x, <any> 'X');
        assert.deepEqual((<any> path.value).y, <any> 1);
      }
    }
  });

  it('Modify string property', async function () {
    let m = await assertIsFound(Model.findOne().exec());

    m.s = 'Value1';

    try {
      await m.saveWithHistory('test1');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 2);

    let c = await assertIsFound(history.Update.findById(m.history.updateIds[1]).exec());

    assert.deepEqual(c.by, 'test1');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 's');
    assert.deepEqual(c.paths[0].value, <any> 'Value1');
  });

  it('Modify number property', async function () {
    let m = await assertIsFound(Model.findOne().exec());

    m.n = 3.14;

    try {
      await m.saveWithHistory('test2');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 3);

    let c = await assertIsFound(history.Update.findById(m.history.updateIds[2]).exec());

    assert.deepEqual(c.by, 'test2');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 'n');
    assert.deepEqual(c.paths[0].value, <any> 3.14);
  });

  it('Modify array property', async function () {
    let m = await assertIsFound(Model.findOne().exec());

    m.a = [ 'd', 'e', 'f' ];

    try {
      await m.saveWithHistory('test3');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 4);

    let c = await assertIsFound(history.Update.findById(m.history.updateIds[3]).exec());

    assert.deepEqual(c.by, 'test3');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 'a');
    assert.sameDeepOrderedMembers(<Array<object>> c.paths[0].value, <any> ['d', 'e', 'f']);
  });

  it('Modify two properties', async function () {
    let m = await assertIsFound(Model.findOne().exec());

    m.s = 'Value2';
    m.n = 4.854;

    try {
      await m.saveWithHistory('test4');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 5);

    let c = await assertIsFound(history.Update.findById(m.history.updateIds[4]).exec());

    assert.deepEqual(c.by, 'test4');
    assert.lengthOf(c.paths, 2);

    assert.sameDeepMembers(c.paths.map((p) => p.name), [ 's', 'n' ]);
    for (let path of c.paths) {
      if (path.name === 's') {
        assert.deepEqual(c.paths[0].value, <any> 'Value2');
      }
      if  (path.name === 'n') {
        assert.deepEqual(path.value, <any> 4.854);
      }
    }
  });

  it('Modify object property', async function () {
    let m = await assertIsFound(Model.findOne().exec());

    m.e.x = 'XX';

    try {
      await m.saveWithHistory('test5');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 6);

    let c = await assertIsFound(history.Update.findById(m.history.updateIds[5]).exec());

    assert.deepEqual(c.by, 'test5');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 'e');
    assert.deepEqual((<any> c.paths[0].value).x, <any> 'XX');
  });

  it('Find by ID with history and modify', async function () {
    let m = await assertIsFound(Model.findOne().exec());

    m = await assertIsFound(Model.findByIdWithHistory(m._id));

    if (m.history.updates) {
      assert.lengthOf(m.history.updates, 6);
    } else {
      throw new AssertionError({ message: 'Updates are undefined'});
    }

    m.s = 'Value3';

    try {
      await m.saveWithHistory('test6');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 7);
    assert.lengthOf(m.history.updates, 7);

    let c = m.history.updates[6];

    assert.deepEqual(c.by, 'test6');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 's');
    assert.deepEqual(c.paths[0].value, <any> 'Value3');
  });

  it('Find one with history and modify', async function () {
    let m = await assertIsFound(Model.findOneWithHistory());

    if (m.history.updates) {
      assert.lengthOf(m.history.updates, 7);
    } else {
      throw new AssertionError({ message: 'Updates are undefined'});
    }

    m.s = 'Value4';

    try {
      await m.saveWithHistory('test7');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 8);
    assert.lengthOf(m.history.updates, 8);

    let c = m.history.updates[7];

    assert.deepEqual(c.by, 'test7');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 's');
    assert.deepEqual(c.paths[0].value, <any> 'Value4');
  });
});
