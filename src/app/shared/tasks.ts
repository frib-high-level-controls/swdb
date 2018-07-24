/**
 * Utility classes for handling task life-cycles
 */
import { EventEmitter } from 'events';

import * as dbg from 'debug';

import * as logging from './logging';
import * as promises from './promises';

const debug  = dbg('webapp:tasks');

const warn = logging.warn;

export type Worker<T> = () => Promise<T> | T;

export type State = 'STARTING' | 'STARTED' | 'STOPPING' | 'STOPPED';

export abstract class AbstractStandardTask<T> extends EventEmitter {

  protected state: State = 'STOPPED';

  public getState(): State {
    return this.state;
  }

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
  }

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
  }

  protected setState(state: State) {
    if (this.state !== state) {
      debug('Task state changed: %s', state);
      this.state = state;
      this.emit(state.toLowerCase());
    }
  }

  protected abstract doStart(): Promise<T>;

  protected abstract doStop(): Promise<void>;
}


export class StandardTask<T> extends AbstractStandardTask<T> {

  protected starter: Worker<T>;
  protected stopper: Worker<void>;

  constructor(starter: Worker<T>, stopper: Worker<void>) {
    super();
    this.starter = starter;
    this.stopper = stopper;
  }

  protected doStart(): Promise<T> {
    try {
      return Promise.resolve(this.starter());
    } catch (err) {
      return Promise.reject(err);
    }
  }

  protected doStop(): Promise<void> {
    try {
      return Promise.resolve(this.stopper());
    } catch (err) {
      return Promise.reject(err);
    }
  }
}


export abstract class AbstractRepeatTask extends AbstractStandardTask<void> {

  protected executing = Promise.resolve();

  public execute(): Promise<void> {
    return this.isExecuting().then((isExecuting) => {
      if (isExecuting) {
        debug('Repeat task is (already) executing');
        return this.executing;
      }
      const now = process.hrtime();
      this.executing = Promise.resolve().then(() => {
        debug('Repeat task executing');
        this.emit('executing');
        return this.doExecute();
      })
      .then(() => {
        debug('Repeat task executed');
        this.emit('executed', process.hrtime(now)[0]);
      })
      .catch((err) => {
        debug('Repeat task executed: %s', err);
        this.emit('error', err);
        throw err;
      });
      return this.executing;
    });
  }

  protected isExecuting(): Promise<boolean> {
    return promises.isPending(this.executing);
  }

  protected abstract doExecute(): Promise<void>;

  protected abstract doInterrupt(): Promise<void>;
}


export abstract class AbstractIntervalTask extends AbstractRepeatTask {

  protected delay: number;

  protected timer: NodeJS.Timer;

  constructor(delay: number) {
    super();
    this.delay = delay;
  }

  public start(): Promise<void> {
    return super.start().then(() => {
      // execute but do not wait //
      this.execute();
    });
  }

  protected doStart(): Promise<void> {
    debug('Set interval timer: %ss', this.delay);
    this.timer = setInterval(() => {
       debug('Execute interval task now');
       this.execute().catch((err) => {
          warn('Error executing interval task: %s', err);
       });
    }, this.delay);
    return Promise.resolve();
  }

  protected doStop(): Promise<void> {
    if (this.timer) {
      debug('Clear interval timer');
      clearInterval(this.timer);
    }
    return this.isExecuting().then((isExecuting) => {
      if (!isExecuting) {
        return this.executing;
      }
      return this.doInterrupt().then(() => this.executing);
    });
  }
}


export class IntervalTask extends AbstractIntervalTask {

  protected executer: Worker<void>;
  protected interrupter: Worker<void> | undefined ;

  constructor(delay: number, executer: Worker<void>, interrupter?: Worker<void>) {
    super(delay);
    this.executer = executer;
    this.interrupter = interrupter;
  }

  protected doExecute(): Promise<void> {
    try {
      return Promise.resolve(this.executer());
    } catch (err) {
      return Promise.reject(err);
    }
  }

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
}
