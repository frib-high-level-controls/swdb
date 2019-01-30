/**
 *  Auth support for OAuth 2.0 support CAS with FORG integration.
 */
import * as querystring from 'querystring';

import * as Debug from 'debug';
import * as express from 'express';
import * as passport from 'passport';
import * as bearer from 'passport-http-bearer';

import * as auth from '../shared/auth';
import * as forgauth from '../shared/forg-auth';
import * as forgapi from '../shared/forgapi';
import * as handlers from '../shared/handlers';
import * as ppauth from '../shared/passport-auth';

import * as casapi from './casapi';

type Request = express.Request;
type RequestHandler = express.RequestHandler;

export interface ForgCasOAuth20AuthcOptions extends passport.AuthenticateOptions {
  ifTokenFound?: boolean;
}

export interface CasOAuth20ProviderOptions {
  serviceId?: string;
  casClient: casapi.IClient;
  forgClient: forgapi.IClient;
}

const debug = Debug('swdb:forg-api-auth');

/// Consider moving this to shared library, passport-auth.ts  ///
export abstract class BearerPassportAbstractProvider<AO extends passport.AuthenticateOptions>
    extends ppauth.PassportAbstractProvider<bearer.Strategy, AO> {

  private strategy: bearer.Strategy;

  constructor() {
    super();

    this.strategy = new bearer.Strategy((token, done) => {
      this.verify(token).then(({ user, info }) => {
        done(null, user || false, info);
      })
      .catch((err: any) => {
        done(err);
      });
    });
  }

  protected getStrategy(): bearer.Strategy {
    return this.strategy;
  }

  protected abstract verify(token: string): Promise<{ user?: auth.IUser | false, info?: any }>;
}


/// Consider moving this to shared library, forg-auth.ts ///

// Simple wrapper to convert from callback-based to promise-based.
function verifyWithForg(client: forgapi.IClient, uid: string, required: boolean) {
  return new Promise<{ user?: forgapi.User | false }>((resolve, reject) => {
    forgauth.verifyWithForg(client, uid, required, (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ user });
    });
  });
}

export class ForgCasOAuth20Provider extends BearerPassportAbstractProvider<ForgCasOAuth20AuthcOptions> {

  private forgClient: forgapi.IClient;

  private casClient: casapi.IClient;

  constructor(options: CasOAuth20ProviderOptions) {
    super();
    this.forgClient = options.forgClient;
    this.casClient = options.casClient;

    // Stategy is initialized in the constructor
    // instead of the initialize() function!
    // This auth provider must be used in
    // conjunction with another "properly"
    // initialized auth provider.
    passport.use(this.getStrategy());
  }

  public getUsername(req: Request): string | undefined {
    return forgauth.getUsername(this, req);
  }

  public getRoles(req: Request): string[] | undefined {
    return forgauth.getRoles(this, req);
  }

  public initialize(): RequestHandler {
    throw new Error('Initialization not allowed for this Auth Provider!');
  }

  public authenticate(options?: ForgCasOAuth20AuthcOptions): RequestHandler {
    const ifTokenFound = options && options.ifTokenFound;
    const authc = super.authenticate(options);
    return (req, res, next) => {
      if (ifTokenFound) {
        // Adapted from: https://github.com/jaredhanson/passport-http-bearer/blob/master/lib/strategy.js#L87
        if (req.headers && req.headers.authorization &&
            !Array.isArray(req.headers.authorization) &&
            /^Bearer /i.test(req.headers.authorization)) {
          debug('Bearer token found in request Authorization header');
          authc(req, res, next);
        } else if (req.body && req.body.access_token) {
          debug('Access token found in request body parameter');
          authc(req, res, next);
        } else if (req.query && req.query.access_token) {
          debug('Access token found in request query parameter');
          authc(req, res, next);
        } else {
          debug('Access token not found so skip authentication');
          next();
        }
        return;
      }
      authc(req, res, next);
    };
  }

  protected async verify(token: string): Promise<{ user?: auth.IUser | false, info?: any }> {
    const profile = await this.casClient.getOAuth20Profile(token);
    if (!profile) {
      return {};
    }

    debug('CAS OAuth2 profile contains id: %s', profile.id);
    debug('CAS OAuth2 profile contains service: %s', profile.service);
    debug('CAS OAuth2 profile contains client_id: %s', profile.client_id);

    let uid: string = profile.id;

    // Check if the UID is encoded in 'UE1' format
    if (/^UE1-/.test(uid)) {
      try {
        const buf = Buffer.from(uid.substr(4), 'base64');
        const data = querystring.parse(buf.toString('utf8'));
        uid = (Array.isArray(data.uid) ? data.uid[0] : data.uid) || '';
      } catch (err) {
        throw new Error(`Error decoding UID format UE1: ${err}`);
      }
    }
    // else {
    //   // Assume that UID is valid (maybe check with RegExp?)
    // }

    if (!uid) {
      return { info: profile };
    }

    debug('CAS OAuth2 token resolved to UID: %s', uid);
    return verifyWithForg(this.forgClient, uid, true);
  }
}
/////////////////////////////////////////////////////////////////////


/**
 * If request is authenticated then ensure user has all of the specified roles.
 */
export function ifAuthcEnsureHasRole(provider: auth.IProvider, ...roles: Array<string | string[]>): RequestHandler {
  return (req, res, next) => {
    if (provider.getUsername(req)) {
      if (!provider.hasRole(req, ...roles)) {
        // auth.sendForbidden(req, res);
        next(new handlers.RequestError(handlers.HttpStatus.FORBIDDEN));
        return;
      }
      next();
    }
  };
}

/**
 * If request os authenticated then ensure user has one of the specified roles.
 */
export function ifAuthcEnsureHasAnyRole(provider: auth.IProvider, ...roles: Array<string | string[]>): RequestHandler {
  return (req, res, next) => {
    if (provider.getUsername(req)) {
      if (!provider.hasAnyRole(req, ...roles)) {
        // auth.sendForbidden(req, res);
        next(new handlers.RequestError(handlers.HttpStatus.FORBIDDEN));
        return;
      }
      next();
    }
  };
}
