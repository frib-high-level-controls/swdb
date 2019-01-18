/**
 *  Auth support for CAS
 */
import * as querystring from 'querystring';

import * as Debug from 'debug';
import * as express from 'express';
import * as passport from 'passport';
import * as bearer from 'passport-http-bearer';
import * as request from 'request';

import * as auth from '../shared/auth';
import * as forgauth from '../shared/forg-auth';
import * as forgapi from '../shared/forgapi';
import * as ppauth from '../shared/passport-auth';

import {
  HttpStatus,
} from '../shared/handlers';

type Request = express.Request;
type RequestHandler = express.RequestHandler;

export interface AuthenticateOptions extends passport.AuthenticateOptions {
  ifTokenFound?: boolean;
}

export interface CasOAuth2NestedProfile {
  attributes?: {};
  id: string;
  client_id?: {};
  service?: {};
}

export interface CasOAuth20ProviderOptions {
  serviceId?: string;
  forgClient: forgapi.IClient;
  casProfileUrl: string;
}

const debug = Debug('swdb:cas-auth');

/// Consider moving this to shared library, passport-auth.ts  ///
export abstract class BearerPassportAbstractProvider<AO extends AuthenticateOptions>
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

export class ForgCasOAuth20Provider extends BearerPassportAbstractProvider<AuthenticateOptions> {

  private serviceId?: string;

  private forgClient: forgapi.IClient;

  private casProfileUrl: string;

  constructor(options: CasOAuth20ProviderOptions) {
    super();
    this.serviceId = options.serviceId;
    this.forgClient = options.forgClient;
    this.casProfileUrl = options.casProfileUrl;
  }

  public getUsername(req: Request): string | undefined {
    return forgauth.getUsername(this, req);
  }

  public getRoles(req: Request): string[] | undefined {
    return forgauth.getRoles(this, req);
  }

  public authenticate(options?: AuthenticateOptions): RequestHandler {
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
          debug('Access token not found so do not authenticate');
          next();
        }
        return;
      }
      authc(req, res, next);
    };
  }

  protected async verify(token: string): Promise<{ user?: auth.IUser | false, info?: any }> {
    const profile = await this.getCasProfile(token);
    if (!profile) {
      return {};
    }

    const uid = profile.id;

    const info = {
      service: profile.service ? String(profile.service) : undefined,
      client_id: profile.client_id ? String(profile.client_id) : undefined,
    };

    debug('CAS OAuth2 profile contains id: %s', uid);
    debug('CAS OAuth2 profile contains client_id: %s', info.client_id);
    debug('CAS OAuth2 profile contains service: %s', info.service);

    if (!this.verifyService(info.service)) {
      debug('CAS OAuth2 service not verified');
      return { info };
    }

    return verifyWithForg(this.forgClient, uid, false);
  }

  protected verifyService(service?: string) {
    if (this.serviceId) {
      debug('Verify service using serviceId: %s', this.serviceId);
      try {
        return Boolean(service && service.match(this.serviceId));
      } catch (err) {
        return false;
      }
    }
    debug('Service verification disabled: no serviceId');
    return true;
  }

  protected async getCasProfile(accessToken: string): Promise<CasOAuth2NestedProfile | null> {
    const qs = {
      access_token: accessToken,
    };
    const headers = {
      Accept: 'application/json,appliation/x-www-form-urlencoded;q=0.9',
    };
    const agentOptions = {
      rejectUnauthorized: false,
    };

    const res = await new Promise<request.Response>((resolve, reject) => {
      request.get({ url: this.casProfileUrl, qs, headers, agentOptions }, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });

    if (res.statusCode === HttpStatus.UNAUTHORIZED) {
      return null;
    }

    if (res.statusCode !== HttpStatus.OK) {
      throw new Error(`CAS OAuth2 Profile response error with status: ${res.statusCode}`);
    }

    let profile: any;
    const contentType = String(res.caseless.get('content-type'));
    switch (contentType.toLowerCase().split(';')[0]) {
    case 'text/json':
    case 'application/json':
      profile = JSON.parse(res.body);
      break;
    case 'application/x-www-form-urlencoded':
      profile = querystring.parse(res.body);
      break;
    default:
      throw new Error(`CAS OAuth2 Profile Content-Type not supported: ${contentType}`);
    }

    if (!profile) {
      throw new Error('CAS OAuth2 Profile is empty');
    }

    if (typeof profile.id !== 'string' || !profile.id) {
      throw new Error(`CAS OAuth2 Profile 'id' attribute missing or not a string`);
    }

    return profile;
  }
}
/////////////////////////////////////////////////////////////////////
