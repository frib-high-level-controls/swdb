/**
 * Implementation of auth.IProvider using FORG
 */
import * as dbg from 'debug';
import * as express from 'express';
import * as passport from 'passport';

import * as auth from './auth';
import * as forgapi from './forgapi';
import * as log from './logging';
import * as ppauth from './passport-auth';

type Request = express.Request;
type AuthenticateOptions = passport.AuthenticateOptions;
type CasAuthenticateOptions = ppauth.CasAuthenticateOptions;

type VerifyPasswordCallback = (err: any, verified?: boolean) => void;

const debug = dbg('webapp:forg-auth');


function getUsername(provider: auth.IProvider, req: Request): string | undefined {
  const user = provider.getUser(req);
  if (!user) {
    return;
  }
  return user.uid ? String(user.uid) : undefined;
}


function getRoles(provider: auth.IProvider, req: Request): string[] | undefined {
  const user = provider.getUser(req);
  if (!user) {
    return;
  }
  return Array.isArray(user.roles) ? user.roles.map(String) : undefined;
}


function verifyWithForg(forgClient: forgapi.IClient, username: string, done: ppauth.VerifyCallback): void {
  debug('Verify with FORG: %s', username);
  forgClient.findUser(username).then((user) => {
    if (!user) {
      debug('FORG user not found');
      done(null, false);
      return;
    }
    if (debug.enabled) {
      debug('FORG user found: %s', JSON.stringify(user));
    }
    done(null, user);
  })
  .catch((err) => {
    done(err);
  });
}


export class ForgCasProvider extends ppauth.CasPassportAbstractProvider<CasAuthenticateOptions> {

  protected forgClient: forgapi.IClient;

  constructor(forgClient: forgapi.IClient, options: ppauth.CasProviderOptions) {
    super(options);
    this.forgClient = forgClient;
  }

  public getUsername(req: Request): string | undefined {
    return getUsername(this, req);
  }

  public getRoles(req: Request): string[] | undefined {
    return getRoles(this, req);
  }

  protected verify(profile: string | ppauth.CasProfile, done: ppauth.VerifyCallback): void {
    let username: string;
    if (typeof profile === 'string') {
      username = profile;
    } else {
      username = profile.user;
    }
    verifyWithForg(this.forgClient, username, done);
  }
}

export abstract class ForgBasicAbstractProvider extends ppauth.BasicPassportAbstractProvider<AuthenticateOptions> {

  protected forgClient: forgapi.IClient;

  constructor(forgClient: forgapi.IClient, options: ppauth.BasicProviderOptions) {
    super(options);
    this.forgClient = forgClient;
  }

  public getUsername(req: Request): string | undefined {
    return getUsername(this, req);
  }

  public getRoles(req: Request): string[] | undefined {
    return getRoles(this, req);
  }

  protected verify(username: string, password: string, done: ppauth.VerifyCallback): void {
    this.verifyPassword(username, password, (err, verified) => {
      if (err) {
        done(err);
        return;
      }
      if (!verified) {
        done(null, false);
        return;
      }
      verifyWithForg(this.forgClient, username, done);
    });
  }

  protected abstract verifyPassword(username: string, password: string, done: VerifyPasswordCallback): void;
}


export class DevForgBasicProvider extends ForgBasicAbstractProvider {

  protected forgClient: forgapi.IClient;
  constructor(forgClient: forgapi.IClient, options: ppauth.BasicProviderOptions) {
    super(forgClient, options);
  }

  protected verifyPassword(username: string, password: string, done: (err: any, verified?: boolean) => void): void {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : undefined;
    if (env === 'production') {
      log.warn('Development Auth Provider DISABLED: PRODUCTION ENVIRONMENT DETECTED');
      done(null, false);
      return;
    }
    log.warn('Development Auth Provider ENABLED: PASSWORD VERIFICATION DISABLED');
    done(null, true);
  }
}
