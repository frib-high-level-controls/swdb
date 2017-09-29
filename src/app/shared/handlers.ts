/*
 * Shared Express request handlers.
 */
import express = require('express');

export import HttpStatus = require('http-status-codes');

export interface HttpStatusError extends Error {
  status: number;
};

export interface RequestPromiseHandler {
  (req: express.Request, res: express.Response, next?: express.NextFunction): PromiseLike<void>;
};

export function catchAll(handler: RequestPromiseHandler): express.RequestHandler {
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
function format(res: express.Response, cbs: { [key: string]: () => Promise<void> | void }): Promise<void> {

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

export function ensureAccepts(type: string): express.RequestHandler;
export function ensureAccepts(type: string[]): express.RequestHandler;
export function ensureAccepts(...type: string[]): express.RequestHandler;
export function ensureAccepts(type: any): express.RequestHandler {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.accepts(type)) {
      next(new RequestError(HttpStatus.getStatusText(HttpStatus.NOT_ACCEPTABLE), HttpStatus.NOT_ACCEPTABLE));
    }
    next();
  };
};

export function notFoundHandler(req: express.Request, res: express.Response, next: express.NextFunction) {
  let status = HttpStatus.NOT_FOUND;
  let message = HttpStatus.getStatusText(status);
  next(new RequestError(message, status));
};

export function requestErrorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  let status = HttpStatus.INTERNAL_SERVER_ERROR;
  let details: RequestErrorDetails = { message: DEFAULT_ERROR_MESSAGE };

  if (err instanceof RequestError) {
    status = err.status;
    details = err.details;
  } else if (err instanceof Error) {
    details = {
      message: err.message,
    };
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
