/*
 * A common module for monitoring the status of an application.
 */
import * as process from 'process';
import * as util from 'util';

import * as express from 'express';
import * as HttpStatus from 'http-status-codes';

import * as tasks from './tasks';

export type Status = 'ERROR' | 'OK';

export interface ComponentStatus {
  status: Status;
  date: Date;
  name: string;
  message: string;
}

export interface ApplicationStatus {
  status: Status;
  uptime: number;
  components: ComponentStatus[];
}

export interface ApiApplicationStatus extends ApplicationStatus {
  name: string;
  version: string;
}

// Utilities

function toMB(memory: number): string {
  return Math.round(memory / 1048576).toString() + 'MB';
}

function toPCT(load: number): string {
  return load.toPrecision(2);
}

// Monitor process CPU load //
let load = 0.0;

export function getLoad(): number {
  return load;
}

let loadStatus: ComponentStatus = {
  status: 'ERROR',
  date: new Date(),
  name: 'Load',
  message: 'Never updated',
};

export function getLoadStatus(): ComponentStatus {
  return loadStatus;
};

let loadLimit = 0.5;

export function getLoadLimit(): number {
  return loadLimit;
};

export function setLoadLimit(limit: number) {
  if (limit > 0.0) {
    loadLimit = limit;
    updateLoadStatus();
  }
};

export function updateLoadStatus() {
   if (load < getLoadLimit()) {
    loadStatus = {
      status: 'OK',
      date: new Date(),
      name: 'Load',
      message: toPCT(load) + ' < ' + toPCT(getLoadLimit()),
    };
  } else {
    loadStatus = {
      status: 'ERROR',
      date: new Date(),
      name: 'Load',
      message: toPCT(load) + ' >= ' + toPCT(getLoadLimit()),
    };
  }
};

let last = process.cpuUsage();

let loadInterval = (10 * 60 * 1000); // 10 minutes //

let loadMonitorTask = new tasks.IntervalTask(loadInterval, () => {
  let next = process.cpuUsage();
  let user = (next.user - last.user) / 1000;
  let system = (next.system - last.system) / 1000;
  load = (user + system) / loadInterval;
  last = next;
  updateLoadStatus();
});


// Monitor application memory //
let memory = process.memoryUsage().heapTotal;

export function getMemory(): number {
  return memory;
}

let memoryStatus: ComponentStatus = {
  status: 'ERROR',
  date: new Date(),
  name: 'Memory',
  message: 'Never updated',
};

export function getMemoryStatus(): ComponentStatus {
  return memoryStatus;
};

let memoryLimit = (2 * 1024 * 1024 * 1024); // 2 Gigabyte //

export function getMemoryLimit(): number {
  return memoryLimit;
};

export function setMemoryLimit(limit: number) {
  if (limit > 0.0) {
    memoryLimit = limit;
    updateMemoryStatus();
  }
};

function updateMemoryStatus() {
 if (memory < getMemoryLimit()) {
    memoryStatus = {
      status: 'OK',
      date: new Date(),
      name: 'Memory',
      message: toMB(memory) + ' < ' + toMB(getMemoryLimit()),
    };
  } else {
    memoryStatus = {
      status: 'ERROR',
      date: new Date(),
      name: 'Memory',
      message: toMB(memory) + ' >= ' + toMB(getMemoryLimit()),
    };
  }
};

let memoryInterval = (1 * 60 * 1000); // 1 minutes //

// Interval timer for memory monitor //
let memoryMonitorTask = new tasks.IntervalTask(memoryInterval, () => {
  memory = process.memoryUsage().heapTotal;
  updateMemoryStatus();
});

// Custom status //

let components: ComponentStatus[] = [];

let testingStatus: ComponentStatus = {
  status: 'OK',
  date: new Date(),
  name: 'Status Test',
  message: 'OK',
};

function setTestingOk(message?: string) {
  testingStatus.status = 'OK';
  testingStatus.date = new Date();
  testingStatus.message = message || 'OK';
};

function setTestingError(message?: string) {
  testingStatus.status = 'ERROR';
  testingStatus.date = new Date();
  testingStatus.message = message || 'ERROR';
};


export function getStatus(): ApplicationStatus {
  let status: ApplicationStatus = {
    status: 'OK',
    uptime: process.uptime(),
    components: [],
  };

  if (testingStatus.status !== 'OK') {
    status.components.push(testingStatus);
    status.status = 'ERROR';
  }

  status.components.push(memoryStatus);
  if (memoryStatus.status !== 'OK') {
    status.status = 'ERROR';
  }

  status.components.push(loadStatus);
  if (loadStatus.status !== 'OK') {
    status.status = 'ERROR';
  }

  for (let comp of components) {
    status.components.push(comp);
    if (comp.status !== 'OK') {
      status.status = 'ERROR';
    }
  }

  return status;
};

export function getComponent(name: string): ComponentStatus | undefined {
  for (let comp of components) {
    if (comp.name === name) {
      return comp;
    }
  }
};

export function setComponentOk(name: string, message?: string, ...param: any[]): void {
  for (let comp of components) {
    if (comp.name === name) {
      comp.status = 'OK';
      comp.date = new Date();
      comp.message = message ? util.format(message, ...param) : 'OK';
      return;
    }
  }
  components.push({
    status: 'OK',
    date: new Date(),
    name: name,
    message: message ? util.format(message, ...param) : 'OK',
  });
};

export function setComponentError(name: string, message?: string, ...param: any[]): void {
  for (let comp of components) {
    if (comp.name === name) {
      comp.status = 'ERROR';
      comp.date = new Date();
      comp.message = message ? util.format(message, ...param) : 'ERROR';
      return;
    }
  }
  components.push({
    status: 'ERROR',
    date: new Date(),
    name: name,
    message: message ? util.format(message, ...param) : 'ERROR',
  });
};


export const monitor = new tasks.StandardTask<void>(
  async () => {
    await Promise.all([
      loadMonitorTask.start(),
      memoryMonitorTask.start(),
    ]);
  },
  async () => {
    await Promise.all([
      loadMonitorTask.stop(),
      memoryMonitorTask.stop(),
    ]);
  },
);


export const router = express.Router();

let statusTestTimer: NodeJS.Timer | undefined;

function getApiStatus(app: express.Application): ApiApplicationStatus {
  let status = getStatus();
  return {
    status: status.status,
    uptime: status.uptime,
    components: status.components,
    name: String(app.get('name') || ''),
    version: String(app.get('version') || ''),
  };
};

function getHttpStatus(status: ApplicationStatus): number {
  if (status.status !== 'OK') {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
  return HttpStatus.OK;
};

router.get('/', (req: express.Request, res: express.Response) => {
  let status = getApiStatus(req.app);
  res.format({
    'text/html': () => {
      res.status(getHttpStatus(status)).render('status', {
        testing: (testingStatus.status !== 'OK'),
        status: status,
      });
    },
    'application/json': () => {
      res.status(getHttpStatus(status)).json(status);
    },
    'default': () => {
      res.status(getHttpStatus(status)).send(status.status);
    },
  });
});

router.post('/', (req: express.Request, res: express.Response) => {
  res.format({
    'text/html': () => {
      if (req.body.test === 'start') {
        if (testingStatus.status === 'OK') {
          setTestingError('Duration 30s');
          statusTestTimer = setTimeout(setTestingOk, 30000);
        }
      } else {
        setTestingOk();
        if (statusTestTimer) { clearTimeout(statusTestTimer); }
      }
      res.redirect(req.originalUrl);
    },
  });
});
