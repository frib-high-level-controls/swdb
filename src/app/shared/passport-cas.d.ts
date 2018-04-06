/**
 * Type declaration for the 'passport-cas' package
 * See: https://www.npmjs.com/package/passport-cas
 */
declare module 'passport-cas' {

  import * as express from 'express';
  import * as passport from 'passport';

  interface StrategyOptions {
    version?: 'CAS1.0' | 'CAS3.0';
    ssoBaseURL: string;
    serverBaseURL?: string;
    serviceURL?: string;
    validateURL?: string;
  }

  interface Profile {
    user: string;
    attributes: { [key: string]: any };
  }

  type DoneCallback = (err: any, user?: any, info?: any) => void;

  type VerifyCallback = (profile: string | Profile, done: DoneCallback) => void;

  class Strategy implements passport.Strategy {

    public name?: string;

    constructor(options: StrategyOptions, verify: VerifyCallback);

    public service(req: express.Request): string;

    public authenticate(req: express.Request, options?: any): void;
  }
}
