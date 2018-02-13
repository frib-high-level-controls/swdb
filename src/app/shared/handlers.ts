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
type ErrorRequestHandler = express.ErrorRequestHandler;

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

/**
 * Find the query parameter with the specified name using case-insensitive search.
 * By default the parameter is converted to a string. This can be disabled using the 'raw' option.
 */
export function findQueryParam(req: Request, name: string, caseSensitive: boolean, raw: true): any;
export function findQueryParam(req: Request, name: string, caseSensitive?: boolean, raw?: false): string | undefined;
export function findQueryParam(req: Request, name: string, caseSensitive?: boolean, raw?: boolean): any {
  function safeToString(obj: any): any {
    if (raw) {
      return obj;
    }
    if (obj !== undefined) {
      return String(obj);
    }
  }
  if (req.query.hasOwnProperty(name)) {
    return safeToString(req.query[name]);
  }
  if (!caseSensitive) {
    name = name.toUpperCase();
    for (let key in req.query) {
      if (req.query.hasOwnProperty(key)) {
        if (key.toUpperCase() === name) {
          return safeToString(req.query[key]);
        }
      }
    }
  }
}

/**
 * Wrap the Express format() method to support promises.
 * (For more details: http://expressjs.com/en/api.html#res.format)
 * In addition, this method provides more specific typings than the original.
 */
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

type RequestErrorDetails = webapi.PkgError;

const DEFAULT_ERROR_STATUS = HttpStatus.INTERNAL_SERVER_ERROR;
const DEFAULT_ERROR_MESSAGE = HttpStatus.getStatusText(DEFAULT_ERROR_STATUS);

export class RequestError extends Error implements HttpStatusError  {

  protected static getHttpStatusText(status: number): string {
    try {
      return HttpStatus.getStatusText(status);
    } catch (err) {
      return HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public status = DEFAULT_ERROR_STATUS;

  public details: RequestErrorDetails = {
    code: DEFAULT_ERROR_STATUS,
    message: DEFAULT_ERROR_MESSAGE,
  };

  constructor()
  constructor(msg: string, details?: RequestErrorDetails)
  constructor(status: number, details?: RequestErrorDetails);
  constructor(msg: string, status: number, details?: RequestErrorDetails);
  constructor(msg?: string | number, status?: number | RequestErrorDetails, details?: RequestErrorDetails) {
    super(DEFAULT_ERROR_MESSAGE);

    if (typeof msg === 'string') {
      this.message = msg;
      this.details.message = this.message;
    } else if (typeof msg === 'number') {
      this.status = msg;
      this.message = RequestError.getHttpStatusText(this.status);
      this.details.code = this.status;
      this.details.message = this.message;
      if (typeof status === 'object') {
        this.details = status;
      }
      return;
    }

    if (typeof status === 'number') {
      this.status = status;
      this.details.code = this.status;
    } else if (typeof status === 'object') {
      this.details = status;
      return;
    }

    if (typeof details === 'object') {
      this.details = details;
    }
  }
};

/**
 * Ensure the request contains a valid web API package.
 */
export function ensurePackage(allowError?: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || (!req.body.data || (allowError && !req.body.error))) {
      next(new RequestError('Request body not a valid data package', HttpStatus.BAD_REQUEST));
    }
    next();
  };
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

export function notFoundHandler(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    let status = HttpStatus.NOT_FOUND;
    let message = HttpStatus.getStatusText(status);
    next(new RequestError(message, status));
  };
};

export function requestErrorHandler(): ErrorRequestHandler {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    let status = DEFAULT_ERROR_STATUS;
    let message = DEFAULT_ERROR_MESSAGE;
    let details: RequestErrorDetails = {
      code: status,
      message: message,
    };

    if (err instanceof RequestError) {
      message = err.message;
      status = err.status;
      details = err.details;
    } else if (err instanceof Error) {
      message = err.message;
      details.message = message;
    }

    if (status >= 500) {
      log.error(err);
    }

    format(res, {
      'text/html': () => {
        const env = req.app.get('env');
        const context = {
          code: details.code,
          message: details.message,
          errors: details.errors,
          cause: (env === 'development') ? err : undefined,
        };
        res.status(status).render('error', context);
      },
      'application/json': () => {
        const pkg: webapi.Pkg<undefined> = {
          data: undefined,
          error: details,
        };
        res.status(status).json(pkg);
      },
      'default': () => {
        res.status(status).send(details.message);
      },
    }).catch(next);
  };
};

/**
 * Set the response local 'basePath' to relative
 * path of application base. Redirect GET requests
 * to remove trailing slash.
 */
export function basePathHandler(): RequestHandler {
  return (req, res, next) => {
    let basePaths: string[] = [ '.' ];

    let url = req.url.split('?');
    let segments = url[0].split('/');
    for (let idx = 0; idx < (segments.length - 2); idx += 1) {
      basePaths.push('..');
    }

    let basePath = basePaths.join('/');

    // Redirect to remove trailing slash (GET requests only)
    if ((req.method === 'GET') && (url[0] !== '/') && url[0].endsWith('/')) {
      url[0] = url[0].substr(0, url[0].length - 1);
      res.redirect(basePath + url.join('?'));
      return;
    }

    res.locals.basePath = basePath;
    next();
  };
}
