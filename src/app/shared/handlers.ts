/*
 * Shared Express request handlers.
 */
import * as express from 'express';

import {
  ErrorFormatter as VErrorFormatter,
  Result as VResult,
  ValidationChain,
  validationResult as vresult,
} from 'express-validator/check';

import {
  SanitizationChain,
} from 'express-validator/filter';

import * as HttpStatusCodes from 'http-status-codes';

import * as log from './logging';


type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
type RequestHandler = express.RequestHandler;
type ErrorRequestHandler = express.ErrorRequestHandler;

type C = ValidationChain | SanitizationChain;
type VLocation = 'body' | 'params' | 'query' | 'headers' | 'cookies'; // copied from location.d.ts

interface VError {
  location: VLocation;
  param: string;
  msg: any;
  value: any;
}

export {
  body as check,
} from 'express-validator/check';

export {
  sanitizeBody as sanitize,
} from 'express-validator/filter';

export const HttpStatus = HttpStatusCodes;


export interface HttpStatusError extends Error {
  status: number;
}

export type RequestPromiseHandler = (req: Request, res: Response, next: NextFunction) => PromiseLike<void>;

export function catchAll(handler: RequestPromiseHandler): RequestHandler {
  return (req, res, next) => {
    try {
      Promise.resolve(handler(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}

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
    for (const key in req.query) {
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

    const fcbs: { [key: string]: () => void } = {};
    for (const cb in cbs) {
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
}

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

  constructor(msg?: string | number, details?: RequestErrorDetails)
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
}

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
}

// export function ensureAccepts(type: string): RequestHandler;
export function ensureAccepts(type: string | string[]): RequestHandler;
export function ensureAccepts(...type: string[]): RequestHandler;
export function ensureAccepts(type: string | string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    let accepts: string | false = false;
    if (Array.isArray(type)) {
      accepts = req.accepts(type);
    } else {
      accepts = req.accepts(type);
    }
    if (!accepts) {
      next(new RequestError(HttpStatus.getStatusText(HttpStatus.NOT_ACCEPTABLE), HttpStatus.NOT_ACCEPTABLE));
    }
    next();
  };
}

export function notFoundHandler(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const status = HttpStatus.NOT_FOUND;
    const message = HttpStatus.getStatusText(status);
    next(new RequestError(message, status));
  };
}

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
      // If the error includes a 'status' property then use it.
      // (Specifically added to support passport's AuthenticationError)
      const s = Number((err as any).status);
      if (s >= 100 && s < 600) {
        status = Math.floor(s);
        details.code = status;
      }
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
}


/**
 * Noop request handler useful for initial values or placeholders.
 */
export function noopHandler(err?: any): RequestHandler {
  return (req, res, next) => {
    if (err) {
      next(err);
      return;
    }
    next();
  };
}


/**
 * Set the response local 'basePath' to relative
 * path of application base. Redirect GET requests
 * to remove trailing slash.
 */
export function basePathHandler(): RequestHandler {
  return (req, res, next) => {
    const basePaths: string[] = [ '.' ];

    const url = req.url.split('?');
    const segments = url[0].split('/');
    for (let idx = 0; idx < (segments.length - 2); idx += 1) {
      basePaths.push('..');
    }

    const basePath = basePaths.join('/');

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


/**
 * Process the given validation or sanitation chains for a request.
 */
export function validate(req: Request, chains: C[]): Promise<void> {
  let p = Promise.resolve();
  for (const chain of chains) {
    p = p.then(() => {
      return new Promise<void>((resolve, reject) => {
        // Response is not required to process chain,
        // but need cast to work around type checks.
        chain(req, null as any, resolve);
      });
    });
  }
  return p;
}

/**
 * Fomat a validation error as Package Error Detail.
 */
export const pkgErrorDetailFormatter: VErrorFormatter = (verror): webapi.PkgErrorDetail => {
  return {
    reason: 'ValidationError',
    location: verror.param,
    message: verror.msg,
  };
};

/**
 * Get the validation results from the request. If 'format' is true then convert the result
 * to a PkgErrorDetail object. A custom validation error formatter may also be provided.
 */
export function validationResult(req: Request, formatWith?: false): VResult<VError>;
export function validationResult(req: Request, formatWith: true): VResult<webapi.PkgErrorDetail>;
export function validationResult<T = VError>(req: Request, formatWith: VErrorFormatter<T> ): VResult<T>;
export function validationResult<T = VError>(req: Request, formatWith?: boolean | VErrorFormatter<T> ): VResult<T> {
  const result = vresult<T>(req);
  if (!formatWith) {
    return result;
  }
  if (formatWith === true) {
    return result.formatWith(pkgErrorDetailFormatter);
  }
  return result.formatWith(formatWith);
}

/**
 * Process the given validation or sanitation chains, and if the result
 * contains a validation error then prepare and throw a RequestError.
 */
export function validateAndThrow(req: Request, chains: C[]): Promise<void>;
export function validateAndThrow(req: Request, msg: string, chains: C[]): Promise<void>;
export function validateAndThrow(req: Request, msg: string, code: number, chains: C[]): Promise<void>;
export function validateAndThrow(req: Request, msg?: string | C[], code?: number | C[], chains?: C[]): Promise<void> {
  let vmsg = 'Request data validation error';
  let vcode = HttpStatus.BAD_REQUEST;
  if (Array.isArray(msg)) {
    chains = msg;
  } else if (msg) {
    vmsg = msg;
  }
  if (Array.isArray(code)) {
    chains = code;
  } else if (code) {
    vcode = code;
  }
  if (!Array.isArray(chains)) {
     return Promise.resolve();
  }
  return validate(req, chains).then(() => {
    const result = validationResult(req, true);
    if (!result.isEmpty()) {
      const perror: webapi.PkgError = {
        code: vcode,
        message: vmsg,
        errors: result.array(),
      };
      throw new RequestError(perror.message, perror.code, perror);
    }
  });
}
