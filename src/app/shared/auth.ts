/**
 * Shared authentication and authorization utilities.
 */
import * as util from 'util';

import * as HttpStatus from 'http-status-codes';
import * as URI from 'uri-js';

import * as dbg from 'debug';
import * as express from 'express';

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
type RequestHandler = express.RequestHandler;

export interface IUser {
  [key: string]: {} | undefined;
};

/**
 * The IProvider interface is based on the Passport API.
 * See: http://passportjs.org
 */
export interface IProvider {

  authenticate(options?: any): RequestHandler;

  logout(req: Request): void;

  getUser(req: Request): IUser | undefined;

  getUsername(req: Request): string | undefined;

  getRoles(req: Request): string[] | undefined;

  hasUsername(req: Request, username: string | string[]): boolean;

  hasRole(req: Request, role: string | string[]): boolean;

  hasAnyRole(req: Request, role: string | string[]): boolean;
};

const debug = dbg('webapp:auth');


export abstract class AbstractProvider implements IProvider {

  public abstract authenticate(options?: any): RequestHandler;

  public abstract logout(req: Request): void;

  public abstract getUser(req: Request): IUser | undefined;

  public abstract getUsername(req: Request): string | undefined;

  public abstract getRoles(req: Request): string[] | undefined;

  public hasUsername(req: Request, username: string | string[]): boolean {
    const name = this.getUsername(req);
    if (!name) {
      return false;
    }

    const usernames = new Set<string>();
    if (Array.isArray(username)) {
      for (let u of username) {
        usernames.add(u.toUpperCase());
      }
    } else {
      usernames.add(username.toUpperCase());
    }

    return usernames.has(name.toUpperCase());
  };

  public hasRole(req: Request, role: string | string[]): boolean {
    const userRoles = this.getRoles(req);
    if (!userRoles) {
      return false;
    }

    const roles = new Set<string>();
    if (Array.isArray(role)) {
      for (let r of role) {
        roles.add(r.toUpperCase());
      }
    } else {
      roles.add(role.toUpperCase());
    }

    for (let userRole of userRoles) {
      if (!roles.has(userRole.toUpperCase())) {
        return false;
      }
    }
    return true;
  };

  public hasAnyRole(req: Request, role: string | string[]): boolean {
    const userRoles = this.getRoles(req);
    if (!userRoles) {
      return false;
    }

    const roles = new Set<string>();
    if (Array.isArray(role)) {
      for (let r of role) {
        roles.add(r.toUpperCase());
      }
    } else {
      roles.add(role.toUpperCase());
    }

    for (let userRole of userRoles) {
      if (roles.has(userRole.toUpperCase())) {
        return true;
      }
    }
    return false;
  };

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
  };
};


class NullProvider extends AbstractProvider {

  public authenticate(options: object): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      res.status(HttpStatus.FORBIDDEN);
      res.send('not authorized');
    };
  };

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
};

export function sendUnauthorized(req: Request, res: Response, type: string, realm: string, msg?: string) {
  res.header('WWW-Authenticate', util.format('%s realm="%s"', type, realm));
  res.status(HttpStatus.UNAUTHORIZED);
  res.send(msg ? msg : HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED));
};

export function sendForbidden(req: Request, res: Response, msg?: string) {
  res.status(HttpStatus.FORBIDDEN);
  res.send(msg ? msg : HttpStatus.getStatusText(HttpStatus.FORBIDDEN));
};


const nullProvider = new NullProvider();

let defaultProvider: IProvider | undefined;

export function getProvider(): IProvider {
  return defaultProvider || nullProvider;
};

export function setProvider(provider: IProvider) {
  defaultProvider = provider;
};

export function getUsername(req: Request): string | undefined {
  return getProvider().getUsername(req);
};

export function hasUsername(req: Request, username: string | string[]): boolean {
  return getProvider().hasUsername(req, username);
};

export function hasRole(req: Request, role: string | string[]): boolean {
  return getProvider().hasRole(req, role);
};

export function hasAnyRole(req: Request, role: string | string[]): boolean {
  return getProvider().hasAnyRole(req, role);
};

// TODO: Consider making this a function that returns a request handler.
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const username = getUsername(req);
  if (!username) {
    const redirectUrl = '/login?bounce=' + encodeURIComponent(req.originalUrl);
    debug('Request NOT authenticted: Redirect: %s', redirectUrl);
    res.redirect(redirectUrl);
    return;
  }
  next();
};

export function ensureHasUsername(username: string | string[]): RequestHandler {
  return (req, res, next) => {
    ensureAuthenticated(req, res, (err: any) => {
      if (!hasUsername(req, username)) {
        sendForbidden(req, res);
        return;
      }
      next();
    });
  };
};

export function ensureHasRole(role: string | string[]): RequestHandler {
  return (req, res, next) => {
    ensureAuthenticated(req, res, (err: any) => {
      if (!hasRole(req, role)) {
        sendForbidden(req, res);
        return;
      }
      next();
    });
  };
};

export function ensureHasAnyRole(role: string | string[]): RequestHandler {
  return (req, res, next) => {
    ensureAuthenticated(req, res, (err: any) => {
      if (!hasAnyRole(req, role)) {
        sendForbidden(req, res);
        return;
      }
      next();
    });
  };
};


type RoleScheme = 'USR' | 'GRP' | 'VAR' | 'SYS' | 'ADM';

type RoleComponents = { scheme: RoleScheme, identifier: string, qualifier?: string };

export function equalRole(role1: string, role2: string): boolean {
  if (!role1 || !role2) {
    return false;
  }
  return (role1.toUpperCase() === role2.toUpperCase());
};

export function parseRole(role: string): RoleComponents | undefined {
  const uri = URI.parse(role);
  const scheme = uri.scheme ? uri.scheme.toUpperCase() : '';
  switch (scheme) {
    case 'USR':
    case 'GRP':
    case 'VAR':
    case 'SYS':
    case 'ADM':
       break;
    default:
      return;
  }
  return {
    scheme: scheme,
    identifier: uri.path ? uri.path.toUpperCase() : '',
    qualifier: uri.fragment ? uri.fragment.toUpperCase() : undefined,
  };
};

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
};
