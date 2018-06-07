/*
 * Simple implementation of the logging using only standard library.
 */
import util = require('util');

export type Logger = (message?: any, ...optionalParams: any[]) => void;


export function getLog(): Logger {
  return log;
}

export function setLog(logger: Logger) {
  log = logger;
}

export let log: Logger = (message?: any, ...optionalParams: any[]): void => {
  console.log('INFO: ' + util.format(message, ...optionalParams)); // tslint:disable-line
};


export function getInfo(): Logger {
  return info;
}

export function setInfo(logger: Logger) {
  info = logger;
}

export let info: Logger = (message?: any, ...optionalParams: any[]): void => {
  console.info('INFO: ' + util.format(message, ...optionalParams)); // tslint:disable-line
};


export function getWarn(): Logger {
  return warn;
}

export function setWarn(logger: Logger) {
  warn = logger;
}

export let warn: Logger = (message?: any, ...optionalParams: any[]): void => {
  console.warn('WARN: ' + util.format(message, ...optionalParams)); // tslint:disable-line
};


export function getError(): Logger {
  return error;
}

export function setError(logger: Logger) {
  error = logger;
}

export let error: Logger = (message?: any, ...optionalParams: any[]): void => {
  console.error('ERROR: ' + util.format(message, ...optionalParams)); // tslint:disable-line
};
