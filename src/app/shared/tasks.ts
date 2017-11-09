/**
 * Utility classes for handling task life-cycles
 */
import { EventEmitter } from 'events';

import * as dbg from 'debug';

const debug  = dbg('webapp:tasks');


export type Worker<T> = () => Promise<T> | T;

export type State = 'STARTING' | 'STARTED' | 'STOPPING' | 'STOPPED';

export abstract class AbstractStandardTask<T> extends EventEmitter {

  protected state: State = 'STOPPED';

  public getState(): State {
    return this.state;
  };

  public start(): Promise<T> {
    debug('Initiate task start');
    if (this.state !== 'STOPPED') {
      return Promise.reject(new Error(`Illegal state: ${this.state}, expecting: STOPPED`));
    }
    return Promise.resolve().then(() => {
      this.setState('STARTING');
      return this.doStart();
    })
    .then((result) => {
      this.setState('STARTED');
      return result;
    })
    .catch((err) => {
      this.setState('STOPPING');
      return this.doStop().then(() => {
        this.setState('STOPPED');
        throw err;
      })
      .catch(() => {
        this.setState('STOPPED');
        throw err;
      });
    });
  };

  public stop(): Promise<void> {
    debug('Initiate task stop');
    if (this.state === 'STOPPED') {
      debug('Task state is already STOPPED');
      return Promise.resolve();
    }
    if (this.state !== 'STARTED') {
      return Promise.reject(new Error(`Illegal state: ${this.state}, expecting: STARTED`));
    }
    return Promise.resolve().then(() => {
      this.setState('STOPPING');
      return this.doStop();
    })
    .then(() => {
      this.setState('STOPPED');
    })
    .catch((err) => {
      this.setState('STOPPED');
      throw err;
    });
  };

  protected setState(state: State) {
    if (this.state !== state) {
      debug('Task state changed: %s', state);
      this.state = state;
      this.emit(state);
    }
  };

  protected abstract doStart(): Promise<T>;

  protected abstract doStop(): Promise<void>;
};


export class StandardTask<T> extends AbstractStandardTask<T> {

  protected starter: Worker<T>;
  protected stopper: Worker<void>;

  constructor(starter: Worker<T>, stopper: Worker<void>) {
    super();
    this.starter = starter;
    this.stopper = stopper;
  };

  protected doStart(): Promise<T> {
    try {
      return Promise.resolve(this.starter());
    } catch (err) {
      return Promise.reject(err);
    }
  };

  protected doStop(): Promise<void> {
    try {
      return Promise.resolve(this.stopper());
    } catch (err) {
      return Promise.reject(err);
    }
  };
};


export abstract class AbstractIntervalTask extends AbstractStandardTask<void> {

  protected delay: number;

  protected timer: NodeJS.Timer;

  protected executing = Promise.resolve();

  constructor(delay: number) {
    super();
    this.delay = delay;
  };

  public start(): Promise<void> {
    return super.start().then(() => {
      // execute but do not wait //
      this.execute();
    });
  }

  protected doStart(): Promise<void> {
    this.timer = setInterval(() => {
       this.execute();
    }, this.delay);
    return Promise.resolve();
  };

  protected doStop(): Promise<void> {
    if (this.timer) {
      debug('Clear interval timer');
      clearInterval(this.timer);
    }
    return Promise.resolve().then(() => {
      return this.doInterrupt();
    })
    .then(() => {
      return this.executing;
    });
  };

  protected execute(): Promise<void> {
    let now = process.hrtime();
    this.executing = Promise.resolve().then(() => {
      debug('Interval task executing');
      this.emit('EXECUTING');
      return this.doExecute();
    })
    .then(() => {
      debug('Interval task executed');
      this.emit('EXECUTED', process.hrtime(now)[0]);
    })
    .catch((err) => {
      debug('Interval task executed: %s', err);
      this.emit('EXECUTED', process.hrtime(now)[0]);
      throw err;
    });
    return this.executing;
  };

  protected abstract doExecute(): Promise<void>;

  protected abstract doInterrupt(): Promise<void>;
};


export class IntervalTask extends AbstractIntervalTask {

  protected executer: Worker<void>;
  protected interrupter: Worker<void> | undefined ;

  constructor(delay: number, executer: Worker<void>, interrupter?: Worker<void>) {
    super(delay);
    this.executer = executer;
    this.interrupter = interrupter;
  };

  protected doExecute(): Promise<void> {
    try {
      return Promise.resolve(this.executer());
    } catch (err) {
      return Promise.reject(err);
    }
  };

  protected doInterrupt(): Promise<void> {
    if (!this.interrupter) {
      return Promise.resolve();
    }
    try {
      return Promise.resolve(this.interrupter());
    } catch (err) {
      return Promise.reject(err);
    }
  }
};
