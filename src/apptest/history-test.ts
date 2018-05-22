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
}

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


describe('Model History Tests', () => {

  before(async () => {
    await app.start();
    // remove all documents
    await Model.remove({}).exec();
  });

  after(async () => {
    await app.stop();
  });

  it('Create new Model', async () => {

    const d: IModel = {
      s: 'Value0',
      n: 1,
      a: [ 'a', 'b', 'c' ],
      e: { x: 'X', y: 1 },
      history: { updateIds: [] },
    };
    const m = new Model(d);

    try {
      await m.saveWithHistory('test0');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 1);

    const c = await assertIsFound(history.Update.findById(m.history.updateIds[0]).exec());

    assert.deepEqual(c.by, 'test0');
    assert.lengthOf(c.paths, 4);

    assert.sameDeepMembers(c.paths.map((p) => p.name), [ 's', 'n', 'a', 'e']);
    for (const path of c.paths) {
      if (path.name === 's') {
        assert.deepEqual(c.paths[0].value, 'Value0' as any);
      }
      if  (path.name === 'n') {
        assert.deepEqual(path.value, 1 as any);
      }
      if (path.name === 'a') {
        assert.sameDeepOrderedMembers(path.value as object[], [ 'a', 'b', 'c'] as any);
      }
      if (path.name === 'e') {
        assert.deepEqual((path.value as any).x, 'X' as any);
        assert.deepEqual((path.value as any).y, 1 as any);
      }
    }
  });

  it('Modify string property', async () => {
    const m = await assertIsFound(Model.findOne().exec());

    m.s = 'Value1';

    try {
      await m.saveWithHistory('test1');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 2);

    const c = await assertIsFound(history.Update.findById(m.history.updateIds[1]).exec());

    assert.deepEqual(c.by, 'test1');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 's');
    assert.deepEqual(c.paths[0].value, 'Value1' as any);
  });

  it('Modify number property', async () => {
    const m = await assertIsFound(Model.findOne().exec());

    m.n = 3.14;

    try {
      await m.saveWithHistory('test2');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 3);

    const c = await assertIsFound(history.Update.findById(m.history.updateIds[2]).exec());

    assert.deepEqual(c.by, 'test2');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 'n');
    assert.deepEqual(c.paths[0].value, 3.14 as any);
  });

  it('Modify array property', async () => {
    const m = await assertIsFound(Model.findOne().exec());

    m.a = [ 'd', 'e', 'f' ];

    try {
      await m.saveWithHistory('test3');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 4);

    const c = await assertIsFound(history.Update.findById(m.history.updateIds[3]).exec());

    assert.deepEqual(c.by, 'test3');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 'a');
    assert.sameDeepOrderedMembers(c.paths[0].value as object[], ['d', 'e', 'f'] as any);
  });

  it('Modify two properties', async () => {
    const m = await assertIsFound(Model.findOne().exec());

    m.s = 'Value2';
    m.n = 4.854;

    try {
      await m.saveWithHistory('test4');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 5);

    const c = await assertIsFound(history.Update.findById(m.history.updateIds[4]).exec());

    assert.deepEqual(c.by, 'test4');
    assert.lengthOf(c.paths, 2);

    assert.sameDeepMembers(c.paths.map((p) => p.name), [ 's', 'n' ]);
    for (const path of c.paths) {
      if (path.name === 's') {
        assert.deepEqual(c.paths[0].value, 'Value2' as any);
      }
      if  (path.name === 'n') {
        assert.deepEqual(path.value, 4.854 as any);
      }
    }
  });

  it('Modify object property', async () => {
    const m = await assertIsFound(Model.findOne().exec());

    m.e.x = 'XX';

    try {
      await m.saveWithHistory('test5');
    } catch (err) {
      throw new AssertionError({ message: String(err) });
    }

    assert.lengthOf(m.history.updateIds, 6);

    const c = await assertIsFound(history.Update.findById(m.history.updateIds[5]).exec());

    assert.deepEqual(c.by, 'test5');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 'e');
    assert.deepEqual((c.paths[0].value as any).x, 'XX' as any);
  });

  it('Find by ID with history and modify', async () => {
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

    const c = m.history.updates[6];

    assert.deepEqual(c.by, 'test6');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 's');
    assert.deepEqual(c.paths[0].value, 'Value3' as any);
  });

  it('Find one with history and modify', async () => {
    const m = await assertIsFound(Model.findOneWithHistory());

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

    const c = m.history.updates[7];

    assert.deepEqual(c.by, 'test7');
    assert.lengthOf(c.paths, 1);

    assert.deepEqual(c.paths[0].name, 's');
    assert.deepEqual(c.paths[0].value, 'Value4' as any);
  });
});
