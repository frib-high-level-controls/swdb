/*
 * A common module for monitoring the status of an application.
 */
import process = require('process');

interface ComponentStatus {
  status: string;
  date: Date;
  name: string;
  message: string;
}

interface MonitorStatus {
  status: string;
  uptime: number;
  components: [ComponentStatus];
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

function getLoad(): number {
  return load;
}

let loadStatus: ComponentStatus;

function getLoadStatus(): ComponentStatus {
  return loadStatus;
}

let loadLimit = 0.5;

function getLoadLimit(): number {
  return loadLimit;
};

function setLoadLimit(limit: number) {
  if (limit > 0.0) {
    loadLimit = limit;
    updateLoadStatus();
  }
};

function updateLoadStatus() {
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

function monitorLoad() {
  let next = process.cpuUsage();
  let user = (next.user - last.user) / 1000;
  let system = (next.system - last.system) / 1000;
  load = (user + system) / loadInterval;
  last = next;
  updateLoadStatus();
}

// Initialize load status //
updateLoadStatus();

// TODO: should clear interval //
setInterval(monitorLoad, loadInterval);

// Monitor application memory //
let memory = process.memoryUsage().heapTotal;

function getMemory(): number {
  return memory;
}

let memoryStatus: ComponentStatus;

function getMemoryStatus(): ComponentStatus {
  return memoryStatus;
}

let memoryLimit = (2 * 1024 * 1024 * 1024); // 2 Gigabyte //

function getMemoryLimit(): number {
  return memoryLimit;
};

function setMemoryLimit(limit: number) {
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

function monitorMemory() {
  memory = process.memoryUsage().heapTotal;
  updateMemoryStatus();
};

// Initialize memory status //
updateMemoryStatus();

// TODO: should clear interval
setInterval(monitorMemory, memoryInterval);

// Custom status //

let components = <[ComponentStatus]> [];

function setOk(name: string, message?: string) {
  for (let comp of components) {
    if (name === comp.name) {
      comp.status = 'OK';
      comp.message = message || 'OK';
      return;
    }
  }
  components.push({
    status: 'OK',
    date: new Date(),
    name: name,
    message: message || 'OK',
  });
}

function setError(name: string, message?: string) {
  for (let comp of components) {
    if (name === comp.name) {
      comp.status = 'ERROR';
      comp.message = message || 'ERROR';
      return;
    }
  }
  components.push({
    status: 'ERROR',
    date: new Date(),
    name: name,
    message: message || 'ERROR',
  });
}

function getStatus(): MonitorStatus {
  let status = {
    status: 'OK',
    uptime: process.uptime(),
    components: <[ComponentStatus]> [],
  };

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

export {
  getLoad,
  getLoadLimit,
  setLoadLimit,
  getLoadStatus,
  getMemory,
  getMemoryLimit,
  setMemoryLimit,
  getMemoryStatus,
  getStatus
};
