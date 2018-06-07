/**
 * Client for FORG API
 */
import * as util from 'util';

import * as request from 'request';

import * as auth from './auth';
import * as status from './status';

// Types for API v1
export interface User extends auth.IUser {
  uid: string;
  fullname: string;
  roles: string[];
}

export interface SearchUser {
  uid: string;
  fullname: string;
  role: string;
}

export interface SearchUsersOptions {
  fullname?: string;
  role?: string;
}

export type GroupType = 'LAB' | 'UNIT' | 'DIV' | 'DEPT' | 'GROUP' | 'TEAM' | 'AREA' | 'UNKNOWN';

export interface Group {
  uid: string;
  srcname: string;
  fullname: string;
  leader: string;
  source: string;
  type: GroupType;
}

export interface SearchGroup {
  uid: string;
  srcname: string;
  fullname: string;
  source: string;
  type: GroupType;
  role: string;
}

export interface SearchGroupsOptions {
  srcname?: string;
  fullname?: string;
  leader?: string;
  source?: string;
  type?: string;
}

export interface IClient {
  findUsers(): Promise<User[]>;
  findUser(uid: string): Promise<User | null>;
  findGroups(): Promise<Group[]>;
  findGroup(uid: string): Promise<Group | null>;
  searchUsers(opts: SearchUsersOptions): Promise<SearchUser[]>;
  searchGroups(opts: SearchGroupsOptions): Promise<SearchGroup[]>;
}

export interface ClientOptions {
  url: string;
  agentOptions?: any;
  httpClient?: HttpClient;
}

// Simplified HTTP client types to facilitate testing //
interface HttpClientOptions {
  uri: string;
  qs?: { [key: string]: string | undefined };
  headers?: { [key: string]: string | undefined };
  agentOptions?: any;
}

interface HttpResponse {
  statusCode: number;
}

interface HttpClient {
  get(opts: HttpClientOptions, cb: (err: any, res: HttpResponse, body: any) => void): void;
}


export class Client implements IClient {

  protected options: ClientOptions;

  protected httpClient: HttpClient = request;

  constructor(options: string | ClientOptions) {
    if (typeof options === 'string') {
      options = { url: options };
    }
    this.options = options;

    if (options.httpClient) {
      this.httpClient = options.httpClient;
    }
  }

  public async findUser(uid: string): Promise<User | null> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/users/' + encodeURIComponent(uid);

    return new Promise<User | null>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          const user: User = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(user);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async findUsers(): Promise<User[]> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/users';

    return new Promise<User[]>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          const users: User[] = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(users);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async searchUsers(opts?: SearchUsersOptions): Promise<SearchUser[]> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/search/users';

    if (!reqopts.qs) {
      reqopts.qs = {};
    }
    if (opts) {
      if (opts.fullname) {
        reqopts.qs.fullname = opts.fullname;
      }
      if (opts.role) {
        reqopts.qs.role = opts.role;
      }
    }

    return new Promise<SearchUser[]>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          const users: SearchUser[] = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(users);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async findGroup(uid: string): Promise<Group | null> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/groups/' + encodeURIComponent(uid);

    return new Promise<Group | null>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          const group: Group = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(group);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async findGroups(): Promise<Group[]> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/groups';

    return new Promise<Group[]>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          const groups: Group[] = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(groups);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async searchGroups(opts?: SearchGroupsOptions): Promise<SearchGroup[]> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/api/v1/search/groups';

    if (!reqopts.qs) {
      reqopts.qs = {};
    }
    if (opts) {
      if (opts.srcname) {
        reqopts.qs.srcname = opts.srcname;
      }
      if (opts.fullname) {
        reqopts.qs.fullname = opts.fullname;
      }
      if (opts.leader) {
        reqopts.qs.leader = opts.leader;
      }
      if (opts.source) {
        reqopts.qs.source = opts.source;
      }
      if (opts.type) {
        reqopts.qs.type = opts.type;
      }
    }

    return new Promise<SearchGroup[]>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(util.format('FORG API request: %s, status: %s', reqopts.uri, res.statusCode)));
          return;
        }
        try {
          const groups: SearchGroup[] = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(groups);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async findStatus(): Promise<status.ApiApplicationStatus> {
    const reqopts = this.getBaseOptions();
    reqopts.uri += '/status/json';

    return new Promise<status.ApiApplicationStatus>((resolve, reject) => {
      this.httpClient.get(reqopts, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          const apiAppStatus: status.ApiApplicationStatus = JSON.parse(body);
          // TODO: JSON schema validate!
          resolve(apiAppStatus);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  protected getBaseOptions(): HttpClientOptions {
    if (!this.options.url) {
      throw new Error('FORG API base URL not specified');
    }
    return {
      uri: this.options.url,
      qs: {},
      headers: {
        Accept: 'application/json',
      },
      agentOptions: this.options.agentOptions || {},
    };
  }
}
