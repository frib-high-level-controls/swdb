/*
 * Shared Express request handlers.
 */
import * as express from 'express';

import * as HttpStatusCodes from 'http-status-codes';

import * as log from './logging';


type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
type RequestHandler = express.RequestHandler;

export const HttpStatus = HttpStatusCodes;


export interface HttpStatusError extends Error {
  status: number;
};

export interface RequestPromiseHandler {
  (req: Request, res: Response, next?: NextFunction): PromiseLike<void>;
};

export function catchAll(handler: RequestPromiseHandler): RequestHandler {
  return (req, res, next) => {
    try {
      Promise.resolve(handler(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
};

// Wrap the Express format() method to support promises.
// (For more details: http://expressjs.com/en/api.html#res.format)
// In addition, this method provides more specific typings than the original.
export function format(res: Response, cbs: { [key: string]: () => Promise<void> | void }): Promise<void> {

  return new Promise((resolve, reject) => {
    const wrapper = (cb: () => Promise<void> | void) => {
      return () => {
        try {
          Promise.resolve(cb()).then(resolve, reject);
        } catch (err) {
          reject(err);
        }
      };
    };

    let fcbs: { [key: string]: () => void } = {};
    for (let cb in cbs) {
      if (cbs.hasOwnProperty(cb)) {
        fcbs[cb] = wrapper(cbs[cb]);
      }
    }
    if (!fcbs.default) {
      fcbs.default = wrapper(() => {
        throw new RequestError(HttpStatus.NOT_ACCEPTABLE);
      });
    }
    res.format(fcbs);
  });
};


export interface RequestErrorDetails {
  message?: string;
};

const DEFAULT_ERROR_STATUS = HttpStatus.INTERNAL_SERVER_ERROR;
const DEFAULT_ERROR_MESSAGE = HttpStatus.getStatusText(DEFAULT_ERROR_STATUS);

export class RequestError extends Error implements HttpStatusError  {

  public status = DEFAULT_ERROR_STATUS;
  public details: RequestErrorDetails = { message: DEFAULT_ERROR_MESSAGE };

  constructor()
  constructor(msg: string, details?: RequestErrorDetails)
  constructor(status: number, details?: RequestErrorDetails);
  constructor(msg: string, status: number, details?: RequestErrorDetails);
  constructor(msg?: string | number, status?: number | RequestErrorDetails, details?: RequestErrorDetails) {
    super(typeof msg === 'string' ? msg : DEFAULT_ERROR_MESSAGE);

    if (typeof msg === 'number') {
      if (isValidStatus(msg)) {
        this.status = msg;
        this.message = HttpStatus.getStatusText(msg);
      }
    }

    if (typeof status === 'number') {
      if (isValidStatus(status)) {
        this.status = status;
      }
    } else if (typeof status === 'object') {
      this.details = status;
      return;
    }

    if (typeof details === 'object') {
      this.details = details;
    } else {
      this.details = {
        message: this.message,
      };
      return;
    }
  }
};

function isValidStatus(status: number) {
  for (let k in HttpStatus) {
    if (HttpStatus.hasOwnProperty(k)) {
      if ((<any> HttpStatus)[k] === status) {
        return true;
      }
    }
  }
};

export function ensureAccepts(type: string): RequestHandler;
export function ensureAccepts(type: string[]): RequestHandler;
export function ensureAccepts(...type: string[]): RequestHandler;
export function ensureAccepts(type: any): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.accepts(type)) {
      next(new RequestError(HttpStatus.getStatusText(HttpStatus.NOT_ACCEPTABLE), HttpStatus.NOT_ACCEPTABLE));
    }
    next();
  };
};

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  let status = HttpStatus.NOT_FOUND;
  let message = HttpStatus.getStatusText(status);
  next(new RequestError(message, status));
};

export function requestErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let message = DEFAULT_ERROR_MESSAGE;
  let status = HttpStatus.INTERNAL_SERVER_ERROR;
  let details: RequestErrorDetails = { message: message };

  if (err instanceof RequestError) {
    message = err.message;
    status = err.status;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
    details = { message: message };
  }

  if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
    log.error('%s: %s', message, JSON.stringify(details));
  }

  format(res, {
    'text/html': () => {
      res.status(status).render('error', details);
    },
    'application/json': () => {
      res.status(status).json(details);
    },
    'default': () => {
      res.status(status).send(details.message);
    },
  }).catch(next);
};
