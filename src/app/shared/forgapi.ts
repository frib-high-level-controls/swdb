/**
 * Client for FORG API
 */
import * as util from 'util';

import * as request from 'request';

import * as status from '../shared/status';

// Types for API v1
export interface User {
  uid: string;
  fullname: string;
  lastname: string;
  firstname: string;
  // email: string,
  // office: string,
  // phone: string,
  // mobile: string,
  roles: string[];
};

export interface SearchUser {
  uid: string;
  fullname: string;
  lastname: string;
  firstname: string;
  role: string;
}

export type GroupType = 'LAB' | 'UNIT' | 'DIV' | 'DEPT' | 'GROUP' | 'TEAM' | 'AREA' | 'UNKNOWN';

export interface Group {
  uid: string;
  srcname: string;
  fullname: string;
  leader: string;
  source: string;
  type: GroupType;
};

export interface SearchGroup {
  uid: string;
  srcname: string;
  fullname: string;
  source: string;
  type: GroupType;
  role: string;
};

export interface IClient {
  findUser(uid: string): Promise<User | undefined>;
};

export interface ClientOptions {
  url: string;
  agentOptions?: any;
}

export class Client implements IClient {

  protected options: ClientOptions;

  constructor(options: string | ClientOptions) {
    if (typeof options === 'string') {
      options = { url: options };
    }
    this.options = options;
  };

  public async findUser(uid: string): Promise<User | undefined> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/users/' + encodeURIComponent(uid);

    return new Promise<User | undefined>((resolve, reject) => {
      request.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode === 401) {
          resolve();
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          let user: User = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(user);
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  public async findUsers(): Promise<User[]> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/users';

    return new Promise<User[]>((resolve, reject) => {
      request.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          let users: User[] = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(users);
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  public async findStatus(): Promise<status.ApiApplicationStatus> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/status/json';

    return new Promise<status.ApiApplicationStatus>((resolve, reject) => {
      request.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          let status: status.ApiApplicationStatus = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(status);
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  protected getBaseOptions(): (request.UriOptions & request.CoreOptions) {
    if (!this.options.url) {
      throw new Error('FORG API base URL not specified');
    }
    return {
      uri: this.options.url,
      headers: {
        Accept: 'application/json',
      },
      agentOptions: this.options.agentOptions || {},
    };
  };
};
