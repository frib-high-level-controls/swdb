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
export type ForgDoneCallback = (err: any, user?: forgapi.User | false) => void;
export type PasswordDoneCallback = (err: any, verified?: boolean) => void;

const debug = dbg('webapp:forg-auth');


export function getUsername(provider: auth.IProvider, req: Request): string | undefined {
  const user = provider.getUser(req);
  if (!user) {
    return;
  }
  return user.uid ? String(user.uid) : undefined;
}


export function getRoles(provider: auth.IProvider, req: Request): string[] | undefined {
  const user = provider.getUser(req);
  if (!user) {
    return;
  }
  return Array.isArray(user.roles) ? user.roles.map(String) : undefined;
}


export function verifyWithForg(client: forgapi.IClient, uid: string, required: boolean, done: ForgDoneCallback): void {
  debug('Verify with FORG: %s', uid);
  client.findUser(uid).then((user) => {
    if (!user) {
      if (required) {
        debug('FORG user not found');
        done(null, false);
      } else {
        debug('FORG user not found, proceed without roles!');
        done(null, { uid, fullname: uid, roles: [] });
      }
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


export class ForgCasProvider extends ppauth.CasPassportAbstractProvider<ppauth.CasAuthenticateOptions> {

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

  protected verify(profile: string | ppauth.CasProfile, done: ppauth.CasDoneCallback): void {
    let username: string;
    if (typeof profile === 'string') {
      username = profile;
    } else {
      username = profile.user;
    }
    verifyWithForg(this.forgClient, username, true, done);
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

  protected verify(username: string, password: string, done: ppauth.BasicDoneCallback): void {
    this.verifyPassword(username, password, (err, verified) => {
      if (err) {
        done(err);
        return;
      }
      if (!verified) {
        done(null, false);
        return;
      }
      verifyWithForg(this.forgClient, username, true, done);
    });
  }

  protected abstract verifyPassword(username: string, password: string, done: PasswordDoneCallback): void;
}


export class DevForgBasicProvider extends ForgBasicAbstractProvider {

  protected forgClient: forgapi.IClient;
  constructor(forgClient: forgapi.IClient, options: ppauth.BasicProviderOptions) {
    super(forgClient, options);
  }

  protected verifyPassword(username: string, password: string, done: PasswordDoneCallback): void {
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
