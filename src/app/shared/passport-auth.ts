/*
 * Abstract class for a Passport based auth provider.
 */
import * as dbg from 'debug';
import * as express from 'express';
import * as passport from 'passport';
import * as ppcas from 'passport-cas';
import * as pphttp from 'passport-http';

import * as auth from './auth';

type Request = express.Request;
type RequestHandler = express.RequestHandler;
type Strategy = passport.Strategy;
type AuthenticateOptions = passport.AuthenticateOptions;

export type CasProfile = ppcas.Profile;

// Extracted from the definition of BasicVerifyFunction with the addition of optional 'info' property.
export type BasicDoneCallback = (err: any, user?: any, info?: any) => void;

export type BasicProviderOptions = pphttp.BasicStrategyOptions;

export type CasDoneCallback = ppcas.DoneCallback;

export interface CasProviderOptions {
  casUrl: string;
  casServiceUrl?: string;
  casServiceBaseUrl: string;
  casVersion?: string;
}

export interface CasAuthenticateOptions extends AuthenticateOptions {
  rememberParams?: string | string[];
}

const debug = dbg('webapp:passport-auth');

export abstract class PassportAbstractProvider<S extends Strategy, AO extends AuthenticateOptions>
    extends auth.AbstractProvider<AO> {

  public initialize(): RequestHandler {
    debug('Initialize %s', this.constructor.name);
    passport.use(this.getStrategy());

    // Warning: Ensure the value of `this` is properly captured.
    passport.serializeUser<{}, string>((user, done) => {
      this.serializeUser(user, done);
    });

    // Warning: Ensure the value of `this` is properly captured.
    passport.deserializeUser<{}, string>((id, done) => {
      this.deserializeUser(id, done);
    });

    const router = express.Router();
    router.use(passport.initialize());
    router.use(passport.session());
    router.use(this.locals());
    return router;
  }

  public authenticate(options?: AO): RequestHandler {
    return passport.authenticate(this.getStrategy().name || 'undefined', options || {});
  }

  public logout(req: Request): void {
    req.logout();
  }

  public getUser(req: Request): auth.IUser | undefined {
    return req.user;
  }

  protected abstract getStrategy(): S;

  // Simply serialize the user to JSON string for storage in the session.
  // Override this methods if your application uses a databases, etc.
  protected serializeUser(user: any, done: (err: any, id?: any) => void) {
    try {
      done(null, JSON.stringify(user));
    } catch (err) {
      done(err);
    }
  }

  // Simply deserialize the user from a JSON string from the session.
  // Override this methods if your application uses a databases, etc.
  protected deserializeUser(id: string, done: (err: any, user?: any) => void) {
    try {
      done(null, JSON.parse(String(id)));
    } catch (err) {
      done(err);
    }
  }
}

export abstract class BasicPassportAbstractProvider<AO extends AuthenticateOptions>
    extends PassportAbstractProvider<pphttp.BasicStrategy, AO> {

  protected strategy: pphttp.BasicStrategy;

  constructor(options: BasicProviderOptions) {
    super();
    if (debug.enabled) {
      debug('Basic Passport options: %s ', JSON.stringify(options));
    }
    this.strategy = new pphttp.BasicStrategy(options, (username, password, done) => {
      this.verify(username, password, done);
    });
  }

  protected getStrategy(): pphttp.BasicStrategy {
    return this.strategy;
  }

  protected abstract verify(username: string, password: string, done: BasicDoneCallback): void;
}

export abstract class CasPassportAbstractProvider<AO extends CasAuthenticateOptions>
    extends PassportAbstractProvider<ppcas.Strategy, AO> {

  protected options: CasProviderOptions;

  protected strategy: ppcas.Strategy;

  constructor(options: CasProviderOptions) {
    super();

    this.options = options;

    if (!options.casUrl) {
      throw new Error('CAS base URL is required');
    }

    if (!options.casServiceBaseUrl) {
      throw new Error('CAS application service base URL is required');
    }

    // The passport-cas library does not directly support version 'CAS2.0',
    // but it can be used as 'CAS3.0' with special configuration.

    let version: 'CAS1.0' | 'CAS3.0';
    if (options.casVersion === 'CAS2.0' || options.casVersion === 'CAS3.0') {
      version = 'CAS3.0';
    } else {
      options.casVersion = 'CAS1.0';
      version = 'CAS1.0';
    }

    const strategyOptions: ppcas.StrategyOptions = {
      ssoBaseURL: options.casUrl,
      serviceURL: options.casServiceUrl,
      serverBaseURL: options.casServiceBaseUrl,
      validateURL: options.casVersion === 'CAS2.0' ? '/serviceValidate' : undefined,
      version: version,
    };
    if (debug.enabled) {
      debug('CAS Passport options: %s ', JSON.stringify(strategyOptions));
    }
    this.strategy = new ppcas.Strategy(strategyOptions, (profile, done) => {
      // Warning: Ensure the value of `this` is properly captured.
      // (An arrow function is used here, but this.verify.bind(this) worked too.)
      this.verify(profile, done);
    });
  }

  public authenticate(options?: AO): RequestHandler {
    const prefix = 'CasPassportAbstractProvider_Param_';
    const rememberParams = new Map<string, string>();
    if (options && Array.isArray(options.rememberParams)) {
      for (const param of options.rememberParams) {
        if (typeof param === 'string') {
          const key = prefix + param.replace(/\w/, '_');
          if (!rememberParams.has(key)) {
            rememberParams.set(key, param);
          }
        }
      }
    } else if (options && typeof options.rememberParams === 'string') {
      const key = prefix + options.rememberParams.replace(/\w/, '_');
      rememberParams.set(key, options.rememberParams);
    }

    const authenticate = super.authenticate(options);
    return (req, res, next) => {
      if (req.session) {
        // store the query params in the session
        for (const [key, param] of rememberParams) {
          if (req.query[param]) {
            debug('Remember query param: %s=%s', param, req.query[param]);
            req.session[key] = req.query[param];
          }
        }
      }
      authenticate(req, res, (err) => {
        if (req.session) {
          // restore the query params from the session
          for (const [key, param] of rememberParams) {
            if (req.session[key]) {
              if (!req.query[param]) {
                req.query[param] = req.session[key];
                debug('Restore query param: %s=%s', param, req.query[param]);
              }
              // cleanup the session
              req.session[key] = undefined;
            }
          }
        }
        next(err);
      });
    };
  }

  public getCasLogoutUrl(service?: boolean | string): string {
    // Redirect to CAS logout. CAS v3 uses 'service' parameter and
    // CAS v2 uses 'url' parameter to allow redirect back to service
    // after logout is complete. The specification does not require
    // the 'gateway' parameter for logout, but RubyCAS needs it to redirect.
    let serviceURL: string | undefined;
    if (service) {
      if (typeof service === 'string') {
        serviceURL = service;
      } else {
        serviceURL = this.options.casServiceBaseUrl;
      }
    }
    let logoutUrl = this.options.casUrl + '/logout';
    if (serviceURL) {
      if (this.options.casVersion === 'CAS3.0') {
        logoutUrl += '?service=' + encodeURIComponent(serviceURL);
      } else if (this.options.casVersion === 'CAS2.0') {
        logoutUrl += '?url=' + encodeURIComponent(serviceURL);
      }
    }
    return logoutUrl;
  }

  protected getStrategy(): ppcas.Strategy {
    return this.strategy;
  }

  protected abstract verify(profile: string | CasProfile, done: CasDoneCallback): void;
}
