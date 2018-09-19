/**
 * Support for non-webapp-template functionality.
 */
import * as express from 'express';

import * as handlers from '../shared/handlers';
import * as logging from '../shared/logging';

const error = logging.error;

// See the definition of ErrorFormatter provided by express-validator
interface VError {
  location: 'body' | 'params' | 'query' | 'headers' | 'cookies'; // copied from location.d.ts
  param: string;
  msg: any;
  value: any;
}


/**
 * Convert validation error to legacy format (to be phased out)
 */
export function validationErrorFormatter(err: VError) {
  return {
    param: err.param,
    msg: err.msg,
    value: err.value,
  };
}


/**
 *  Original error handling routine (to be phased out)
 */
export function requestErrorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === 'ValidationError') {
    // catch mongo validation errors
    res.status(400);
    res.send(err);
  } else if (err instanceof handlers.RequestError) {
    res.status(err.status);
    res.send(err.message);
  } else {
    res.status(500);
    res.send(err.message || 'An unknown error ocurred');
  }
  if (res.statusCode >= 500) {
    error(err);
  }
}
