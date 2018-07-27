/*
 * Simple implementation of the logging using only standard library.
 */
import util = require('util');

export type Logger = (message?: any, ...optionalParams: any[]) => void;

export interface ILogger extends Logger {
  isEnabled(): boolean;
}

function NewILogger(logger: Logger, isEnabled: () => boolean): ILogger {
  // Cast required to convert regular function to "hybrid" function with method(s)!
  // (see http://www.typescriptlang.org/docs/handbook/interfaces.html#hybrid-types)
  const ilogger = ((message?: any, ...optionalParams: any[]) => {
    logger(message, ...optionalParams);
  }) as ILogger;

  ilogger.isEnabled = isEnabled;

  return ilogger;
}


export function getInfo(): Logger | null {
  return infoLogger;
}

export function setInfo(logger: Logger | null) {
  infoLogger = logger;
}

let infoLogger: Logger | null = (message?: any, ...optionalParams: any[]): void => {
  console.log('INFO: ' + util.format(message, ...optionalParams)); // tslint:disable-line:no-console
};

export const info = NewILogger((message?: any, ...optionalParams: any[]) => {
  if (typeof infoLogger === 'function') {
    infoLogger(message, ...optionalParams);
  }
}, () => (typeof infoLogger === 'function'));


// Log is simply a synonym for Info

export function getLog(): Logger | null {
  return getInfo();
}

export function setLog(logger: Logger | null) {
  setInfo(logger);
}

export const log = info;


export function getWarn(): Logger | null {
  return warnLogger;
}

export function setWarn(logger: Logger | null) {
  warnLogger = logger;
}

let warnLogger: Logger | null = (message?: any, ...optionalParams: any[]): void => {
  console.warn('WARN: ' + util.format(message, ...optionalParams)); // tslint:disable-line:no-console
};

export const warn = NewILogger((message?: any, ...optionalParams: any[]) => {
  if (typeof warnLogger === 'function') {
    warnLogger(message, ...optionalParams);
  }
}, () => (typeof warnLogger === 'function'));


export function getError(): Logger | null {
  return errorLogger;
}

export function setError(logger: Logger | null) {
  errorLogger = logger;
}

let errorLogger: Logger | null = (message?: any, ...optionalParams: any[]): void => {
  console.error('ERROR: ' + util.format(message, ...optionalParams)); // tslint:disable-line:no-console
};

export let error = NewILogger((message?: any, ...optionalParams: any[]) => {
  if (typeof errorLogger === 'function') {
    errorLogger(message, ...optionalParams);
  }
}, () => (typeof errorLogger === 'function'));
