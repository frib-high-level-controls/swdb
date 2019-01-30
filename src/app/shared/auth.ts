/**
 * Shared authentication and authorization utilities.
 */
import * as util from 'util';

import * as URI from 'uri-js';

import * as dbg from 'debug';
import * as express from 'express';

import * as log from './logging';

import {
  HttpStatus,
  RequestError,
} from './handlers';

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
type RequestHandler = express.RequestHandler;

export interface IUser {
  [key: string]: {} | undefined;
}

/**
 * The IProvider interface is based on the Passport API.
 * See: http://passportjs.org
 */
export interface IProvider<AO = {}> {

  initialize(): RequestHandler;

  authenticate(options?: AO): RequestHandler;

  logout(req: Request): void;

  getUser(req: Request): IUser | undefined;

  getUsername(req: Request): string | undefined;

  getRoles(req: Request): string[] | undefined;

  hasUsername(req: Request, ...username: Array<string | string[]>): boolean;

  hasRole(req: Request, ...role: Array<string | string[]>): boolean;

  hasAnyRole(req: Request, ...role: Array<string | string[]>): boolean;
}

const debug = dbg('webapp:auth');


export abstract class AbstractProvider<AO = {}> implements IProvider<AO> {

  public abstract initialize(): RequestHandler;

  public abstract authenticate(options?: AO): RequestHandler;

  public abstract logout(req: Request): void;

  public abstract getUser(req: Request): IUser | undefined;

  public abstract getUsername(req: Request): string | undefined;

  public abstract getRoles(req: Request): string[] | undefined;

  public hasUsername(req: Request, ...usernames: Array<(string | string[])>): boolean {
    let name = this.getUsername(req);
    if (!name) {
      return false;
    }

    name = name.toUpperCase();
    for (const username of usernames) {
      if (Array.isArray(username)) {
        for (const n of username) {
          if (name === n.toUpperCase()) {
            return true;
          }
        }
      } else {
        if (name === username.toUpperCase()) {
          return true;
        }
      }
    }
    return false;
  }

  public hasRole(req: Request, ...roles: Array<(string | string[])>): boolean {
    const userRoles = this.getRoles(req);
    if (!userRoles) {
      return false;
    }

    const userRoleSet = new Set<string>();
    for (const ur of userRoles) {
      userRoleSet.add(ur.toUpperCase());
    }

    for (const role of roles) {
      if (Array.isArray(role)) {
        for (const r of role) {
          if (!userRoleSet.has(r.toUpperCase())) {
            return false;
          }
        }
      } else {
        if (!userRoleSet.has(role.toUpperCase())) {
          return false;
        }
      }
    }
    return true;
  }

  public hasAnyRole(req: Request, ...roles: Array<(string | string[])>): boolean {
    const userRoles = this.getRoles(req);
    if (!userRoles) {
      return false;
    }

    const userRoleSet = new Set<string>();
    for (const ur of userRoles) {
      userRoleSet.add(ur.toUpperCase());
    }

    for (const role of roles) {
      if (Array.isArray(role)) {
        for (const r of role) {
          if (userRoleSet.has(r.toUpperCase())) {
            return true;
          }
        }
      } else {
        if (userRoleSet.has(role.toUpperCase())) {
          return true;
        }
      }
    }
    return false;
  }

  protected locals(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      debug('Add \'auth\' to response locals');
      res.locals.auth = {
        user: this.getUser(req),
        username: this.getUsername(req),
        hasRole: (role: string | string[]): boolean => {
          return this.hasRole(req, role);
        },
        hasAnyRole: (role: string | string[]): boolean => {
          return this.hasAnyRole(req, role);
        },
      };
      next();
    };
  }
}


class NullProvider extends AbstractProvider {

  public initialize(): RequestHandler {
    log.warn('Initialize NullAuthProvider');
    return (req, res, next) => {
      next();
    };
  }

  public authenticate(options?: {}): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      sendForbidden(req, res);
    };
  }

  public logout(req: Request): void {
    return;
  }

  public getUser(req: Request): IUser | undefined {
    return;
  }

  public getUsername(req: Request): string | undefined {
    return;
  }

  public getRoles(req: Request): string[] | undefined {
    return;
  }
}

// tslint:disable:max-line-length
export const sendUnauthorized = util.deprecate((req: Request, res: Response, type: string, realm: string, msg?: string) => {
  res.header('WWW-Authenticate', util.format('%s realm="%s"', type, realm));
  res.status(HttpStatus.UNAUTHORIZED);
  res.send(msg ? msg : HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED));
}, 'auth.sendUnauthorized() is deprecated');

export const sendForbidden = util.deprecate((req: Request, res: Response, msg?: string) => {
  res.status(HttpStatus.FORBIDDEN);
  res.send(msg ? msg : HttpStatus.getStatusText(HttpStatus.FORBIDDEN));
}, 'auth.sendForbidden() is deprecated: consider using auth.setFailWithError(true)');


const nullProvider = new NullProvider();

let defaultProvider: IProvider | undefined;

export function getProvider(): IProvider {
  return defaultProvider || nullProvider;
}

export function setProvider(provider: IProvider) {
  defaultProvider = provider;
}

let failWithError = false;

export function isFailWithError() {
  return failWithError;
}

export function setFailWithError(value: boolean) {
  failWithError = value;
}

export function getUsername(req: Request): string | undefined {
  return getProvider().getUsername(req);
}

export function hasUsername(req: Request, ...usernames: Array<string | string[]>): boolean {
  return getProvider().hasUsername(req, ...usernames);
}

export function hasRole(req: Request, ...roles: Array<string | string[]>): boolean {
  return getProvider().hasRole(req, ...roles);
}

export function hasAnyRole(req: Request, ...roles: Array<string | string[]>): boolean {
  return getProvider().hasAnyRole(req, ...roles);
}

export function ensureAuthc(): RequestHandler {
  return (req, res, next) => {
    const username = getUsername(req);
    if (!username) {
      const redirectUrl = '/login?bounce=' + encodeURIComponent(req.originalUrl);
      debug('Request NOT authenticted: Redirect: %s', redirectUrl);
      res.redirect(redirectUrl);
      return;
    }
    next();
  };
}

// Retained for backwards compatibility
export const ensureAuthenticated = ensureAuthc();

export function ensureHasUsername(...usernames: Array<string | string[]>): RequestHandler {
  const authc = ensureAuthc();
  return (req, res, next) => {
    authc(req, res, (err: any) => {
      if (!hasUsername(req, ...usernames)) {
        if (failWithError) {
          next(new RequestError(HttpStatus.FORBIDDEN));
        } else {
          sendForbidden(req, res);
        }
        return;
      }
      next();
    });
  };
}

export function ensureHasRole(...roles: Array<string | string[]>): RequestHandler {
  const authc = ensureAuthc();
  return (req, res, next) => {
    authc(req, res, (err: any) => {
      if (!hasRole(req, ...roles)) {
        if (failWithError) {
          next(new RequestError(HttpStatus.FORBIDDEN));
        } else {
          sendForbidden(req, res);
        }
        return;
      }
      next();
    });
  };
}

export function ensureHasAnyRole(...roles: Array<string | string[]>): RequestHandler {
  const authc = ensureAuthc();
  return (req, res, next) => {
    authc(req, res, (err: any) => {
      if (!hasAnyRole(req, ...roles)) {
        if (failWithError) {
          next(new RequestError(HttpStatus.FORBIDDEN));
        } else {
          sendForbidden(req, res);
        }
        return;
      }
      next();
    });
  };
}


export enum RoleScheme {
  USR = 'USR',
  GRP = 'GRP',
  VAR = 'VAR',
  ADM = 'ADM',
  SYS = 'SYS',
}

export interface RoleComponents {
  scheme: RoleScheme;
  identifier: string;
  qualifier?: string;
}

export const ROLE_SCHEMES = [
  RoleScheme.USR,
  RoleScheme.GRP,
  RoleScheme.VAR,
  RoleScheme.ADM,
  RoleScheme.SYS,
];

export function equalRole(role1: string, role2: string): boolean {
  if (!role1 || !role2) {
    return false;
  }
  return (role1.toUpperCase() === role2.toUpperCase());
}

export function parseRole(role: string): RoleComponents | undefined {
  const uri = URI.parse(role);
  let scheme: RoleScheme | undefined;
  if (uri.scheme) {
    uri.scheme = uri.scheme.toUpperCase();
    for (const s of ROLE_SCHEMES) {
      if (s === uri.scheme) {
        scheme = s;
        break;
      }
    }
  }
  if (!scheme) {
    return;
  }
  return {
    scheme: scheme,
    identifier: uri.path ? uri.path.toUpperCase() : '',
    qualifier: uri.fragment ? uri.fragment.toUpperCase() : undefined,
  };
}

export function formatRole(role: RoleComponents): string;
export function formatRole(scheme: RoleScheme, identifier: string, qualifier?: string): string;
export function formatRole(scheme: RoleScheme | RoleComponents, identifier?: string, qualifier?: string): string {
  if (typeof scheme === 'string') {
    scheme = {
      scheme: scheme,
      identifier: identifier || '',
      qualifier: qualifier,
    };
  }
  return URI.serialize({
    scheme: scheme.scheme,
    path: scheme.identifier,
    fragment: scheme.qualifier,
  }).toUpperCase();
}
