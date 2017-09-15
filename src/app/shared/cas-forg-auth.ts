/**
 * Implementation of auth.IProvider interface using CAS and FORG
 */
import * as dbg from 'debug';
import * as express from 'express';
import * as passport from 'passport';
import * as caspassport from 'passport-cas';

import * as auth from './auth';
import * as forgapi from './forgapi';

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
type RequestHandler = express.RequestHandler;

export interface ProviderOptions {
  casUrl: string;
  casServiceUrl: string;
  casAppendPath?: boolean;
  casVersion?: string;
};

const debug = dbg('webapp:cas-forg-auth');


export class CasForgProvider extends auth.AbstractProvider {

  protected forg: forgapi.IClient;

  protected strategy: caspassport.Strategy;

  protected options: ProviderOptions;

  constructor(forg: forgapi.IClient, options: ProviderOptions) {
    super();

    this.forg = forg;
    this.options = options;

    if (!options.casUrl) {
      throw new Error('CAS base URL is required');
    }

    if (!options.casServiceUrl) {
      throw new Error('CAS service URL is required');
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

    const strategyOptions: caspassport.StrategyOptions = {
      ssoBaseURL: options.casUrl,
      serviceURL: options.casAppendPath ? undefined : options.casServiceUrl,
      serverBaseURL: options.casAppendPath ? options.casServiceUrl : undefined,
      validateURL: options.casVersion === 'CAS2.0' ? '/serviceValidate' : undefined,
      version: version,
    };
    if (debug.enabled) {
      debug('CAS Passport options: %s ', JSON.stringify(strategyOptions));
    }
    this.strategy = new caspassport.Strategy(strategyOptions, (profile, done) => {
      // Warning: Ensure the value of `this` is properly captured.
      // (An arrow function is used here, but this.verify.bind(this) worked too.)
      this.verify(profile, done);
    });
  };


  public initialize(): RequestHandler {
    passport.use(this.strategy);

    // Warning: Ensure the value of `this` is properly captured.
    passport.serializeUser<{}, string>((user, done) => {
      this.serializeUser(user, done);
    });

    // Warning: Ensure the value of `this` is properly captured.
    passport.deserializeUser<{}, string>((id, done) => {
      this.deserializeUser(id, done);
    });

    const init = passport.initialize();
    const session = passport.session();

    return (req, res, next) => {
      init(req, res, (err: any) => {
        if (err) {
          next(err);
          return;
        }
        session(req, res, next);
      });
    };
  };

  public getCasLogoutUrl(service?: boolean): string {
    // Redirect to CAS logout. CAS v3 uses 'service' parameter and
    // CAS v2 uses 'url' parameter to allow redirect back to service
    // after logout is complete. The specification does not require
    // the 'gateway' parameter for logout, but RubyCAS needs it to redirect.
    let url = this.options.casUrl + '/logout';
    if (service) {
      if (this.options.casVersion === 'CAS3.0') {
        url += '?service=' + encodeURIComponent(this.options.casServiceUrl);
      } else if (this.options.casVersion === 'CAS2.0') {
        url += '?url=' + encodeURIComponent(this.options.casServiceUrl);
      }
    }
    return url;
  };

  public authenticate(options?: any): express.RequestHandler {
    return passport.authenticate(this.strategy.name || 'cas', options);
  };

  public logout(req: Request): void {
    req.logout();
  };

  public getUser(req: Request): auth.IUser | undefined {
    return req.user;
  };

  public getUsername(req: Request): string | undefined {
    const user = this.getUser(req);
    if (!user) {
      return;
    }
    const username = user.uid;
    if (typeof username !== 'string') {
      return;
    }
    return username;
  };

  public getRoles(req: Request): string[] | undefined {
    const user = this.getUser(req);
    if (!user) {
      return;
    }
    const roles = user.roles;
    if (!Array.isArray(roles)) {
      return;
    }
    return roles;
  };

  protected verify(profile: string | caspassport.Profile, done: caspassport.DoneCallback) {
    let username: string;
    if (typeof profile === 'string') {
      username = profile;
    } else {
      username = profile.user;
    }
    debug('Verify user: %s', username);
    // find user in FORG
    this.forg.findUser(username).then((user) => {
      if (!user) {
        debug('FORG user not found');
        done(null, false);
        return;
      }
      if (debug.enabled) {
        debug('FORG user found with roles: [%s]', user.roles.join(','));
      }
      done(null, user);
    })
    .catch((err) => {
      done(err);
    });
  };

  protected deserializeUser(id: string, done: (err: any, user?: any) => void) {
    try {
      done(null, JSON.parse(String(id)));
    } catch (err) {
      done(err);
    }
  };

  protected serializeUser(user: any, done: (err: any, id?: any) => void) {
    try {
      done(null, JSON.stringify(user));
    } catch (err) {
      done(err);
    }
  };

};
