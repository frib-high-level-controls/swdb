/*
 * Simple implementation of the logging using only standard library.
 */
import util = require('util');

export let log = (message?: any, ...optionalParams: any[]): void => {
  console.log('INFO: ' + util.format(message, ...optionalParams)); // tslint:disable-line
};

export let info = (message?: any, ...optionalParams: any[]): void => {
  console.info('INFO: ' + util.format(message, ...optionalParams)); // tslint:disable-line
};

export let warn = (message?: any, ...optionalParams: any[]): void => {
  console.warn('WARN: ' + util.format(message, ...optionalParams));
};

export let error = (message?: any, ...optionalParams: any[]): void => {
  console.error('ERROR: ' + util.format(message, ...optionalParams));
};
