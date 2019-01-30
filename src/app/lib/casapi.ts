/**
 * Central Authentication Service (CAS) Client API
 */
import * as querystring from 'querystring';
import { URL } from 'url';

import * as Debug from 'debug';
import * as request from 'request';

import {
  HttpStatus,
} from '../shared/handlers';

type ReqCoreOptions = request.CoreOptions & request.UrlOptions;


export interface CasOAuth20Profile {
  id: string;
  service?: string;
  client_id?: string;
}

export interface CasOAuth2NestedProfile extends CasOAuth20Profile {
  attributes?: any;
}

export interface CasOAuth20FlattenedProfile extends CasOAuth20Profile {
  [key: string]: {} | undefined;
}

export interface IClient {
  getOAuth20Profile<P extends CasOAuth20Profile = CasOAuth20Profile>(accessToken: string): Promise<P | null>;
}

export interface ClientOptions {
  url: string;
  agentOptions?: any;
}

interface RequestOptions {
  path: string;
  qs: any;
  headers: any;
}

const debug = Debug('swdb:casapi');

export class Client implements IClient {

  protected url: string;

  protected agentOptions?: any;

  constructor(options: string | ClientOptions) {
    debug('CAS Client Options: %j', options);
    if (typeof options === 'string') {
      options = { url: options };
    }
    const url = new URL(options.url);
    if (!url.pathname.endsWith('/')) {
      url.pathname += '/';
    }
    this.url = url.toString();
    this.agentOptions = options.agentOptions;
  }

  public async getOAuth20Profile<P extends CasOAuth20Profile = CasOAuth20Profile>(token: string): Promise<P | null> {

    const res = await this.get({
      path: 'oauth2.0/profile',
      qs: { access_token: token },
      headers: { Accept: 'application/json,appliation/x-www-form-urlencoded;q=0.9' },
    });

    if (res.statusCode === HttpStatus.UNAUTHORIZED) {
      return null;
    }

    if (res.statusCode !== HttpStatus.OK) {
      throw new Error(`CAS OAuth2 Profile response error with status: ${res.statusCode}`);
    }

    const contentType = String(res.caseless.get('content-type'));

    let profile: any;
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

    if (profile.id !== undefined) {
      profile.id = String(profile.id);
    } else {
      throw new Error(`CAS OAuth2 Profile missing 'id' property`);
    }

    if (profile.service !== undefined) {
      profile.service = String(profile.service);
    }

    if (profile.client_id !== undefined) {
      profile.client_id = String(profile.client_id);
    }

    return profile;
  }

  protected get(options: RequestOptions): Promise<request.Response> {
    const reqopts = this.prepareOptions(options);
    return new Promise((resolve, reject) => {
      request.get(reqopts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  protected prepareOptions(options: RequestOptions): ReqCoreOptions {
    const core = {
      url: this.url + options.path,
      qs: {},
      headers: {
        Accept: 'application/json',
      },
      agentOptions: this.agentOptions || {},
    };
    if (options.qs) {
      Object.assign(core.qs, options.qs);
    }
    if (options.headers) {
      Object.assign(core.headers, options.headers);
    }
    return core;
  }
}
