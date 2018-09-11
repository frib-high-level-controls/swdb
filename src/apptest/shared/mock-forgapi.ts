/*
 * Mock FORG API Client with in-memory user store.
 */
import * as auth from '../../app/shared/auth';
import * as forgapi from '../../app/shared/forgapi';
import * as log from '../../app/shared/logging';

export type User = forgapi.User;
export type Group = forgapi.Group;

export type SearchUser = forgapi.SearchUser;
export type SearchGroup = forgapi.SearchGroup;

export type SearchUsersOptions = forgapi.SearchUsersOptions;
export type SearchGroupsOptions = forgapi.SearchGroupsOptions;


/**
 * Construct a RegExp that matches the given pattern
 *
 * Wildcard: * - match anything
 */
export function matchPattern(pattern: string, flags?: string): RegExp {
  // This snippet for escaping regex special characters is copied from MDN
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  pattern = pattern.replace(/\\\*/g, '(.*)');
  return new RegExp('^' + pattern + '$', flags);
}

export class MockClient implements forgapi.IClient {

  public static getInstance(): MockClient {
    if (MockClient.instance) {
      return MockClient.instance;
    }
    MockClient.instance = new MockClient();
    return MockClient.instance;
  }

  protected static instance: MockClient | undefined;

  public users = new Map<string, User>();

  public groups = new Map<string, Group>();

  public addUser(user: User | User[]) {
    if (Array.isArray(user)) {
      for (const u of user) {
        this.addUser(u);
      }
    } else if (user.uid) {
      user.uid = user.uid.toUpperCase();
      if (this.users.has(user.uid)) {
        log.warn('Mock FORG API already contains user: %s', user.uid);
      }
      this.users.set(user.uid, user);
    }
  }

  public removeUser(uid: string | string[]) {
    if (Array.isArray(uid)) {
      for (const u of uid) {
        this.removeUser(u);
      }
    } else {
      this.users.delete(uid.toUpperCase());
    }
  }

  public clear() {
    this.users.clear();
    this.groups.clear();
  }

  public findUser(uid: string): Promise<User | null> {
    const user = this.users.get(uid.toUpperCase());
    if (!user) {
      return Promise.resolve(null);
    }
    // Deep copy result to avoid incidental modification
    return Promise.resolve(JSON.parse(JSON.stringify(user)));
  }

  public findUsers(): Promise<User[]> {
    // Deep copy result to avoid incidental modification
    return Promise.resolve(JSON.parse(JSON.stringify(Array.from(this.users.values()))));
  }

  public searchUsers(opts: SearchUsersOptions): Promise<SearchUser[]> {
    const users: SearchUser[] = [];

    for (const user of this.users.values()) {
      let conds = 0;
      let found = 0;
      if (opts.fullname) {
        conds += 1;
        if (user.fullname.match(matchPattern(opts.fullname, 'i'))) {
          found += 1;
        }
      }
      if (opts.role) {
        conds += 1;
        if (user.roles.includes(opts.role.toUpperCase())) {
          found += 1;
        }
      }
      if (conds === found) {
        users.push({
          uid: user.uid,
          fullname: user.fullname,
          role: auth.formatRole(auth.RoleScheme.USR, user.uid),
        });
      }
    }
    // Deep copy result to avoid incidental modification
    return Promise.resolve(JSON.parse(JSON.stringify(users)));
  }

  public addGroup(group: Group | Group[]) {
    if (Array.isArray(group)) {
      for (const g of group) {
        this.addGroup(g);
      }
    } else if (group.uid) {
      group.uid = group.uid.toUpperCase();
      if (this.groups.has(group.uid)) {
        log.warn('Mock FORG API already contains group: %s', group.uid);
      }
      this.groups.set(group.uid, group);
    }
  }

  public removeGroup(uid: string | string[]) {
    if (Array.isArray(uid)) {
      for (const u of uid) {
        this.removeGroup(u);
      }
    } else {
      this.users.delete(uid.toUpperCase());
    }
  }

  public findGroup(uid: string): Promise<Group | null> {
    const group = this.groups.get(uid.toUpperCase());
    if (!group) {
      return Promise.resolve(null);
    }
    // Deep copy result to avoid incidental modification
    return Promise.resolve(JSON.parse(JSON.stringify(group)));
  }

  public findGroups(): Promise<Group[]> {
    // Deep copy result to avoid incidental modification
    return Promise.resolve(JSON.parse(JSON.stringify(Array.from(this.groups.values()))));
  }

  public searchGroups(opts: SearchGroupsOptions): Promise<SearchGroup[]> {
    const groups: SearchGroup[] = [];

    for (const group of this.groups.values()) {
      let conds = 0;
      let found = 0;
      if (opts.srcname) {
        conds += 1;
        if (group.srcname.match(matchPattern(opts.srcname, 'i'))) {
          found += 1;
        }
      }
      if (opts.fullname) {
        conds += 1;
        if (group.fullname.match(matchPattern(opts.fullname, 'i'))) {
          found += 1;
        }
      }
      if (opts.leader) {
        conds += 1;
        if (group.leader.toUpperCase() === opts.leader.toUpperCase()) {
          found += 1;
        }
      }
      if (opts.source) {
        conds += 1;
        if (group.source.toUpperCase() === opts.source.toUpperCase()) {
          found += 1;
        }
      }
      if (opts.type) {
        conds += 1;
        if (group.type.toUpperCase() === opts.type.toUpperCase()) {
          found += 1;
        }
      }
      if (conds === found) {
        groups.push({
          uid: group.uid,
          srcname: group.srcname,
          fullname: group.fullname,
          source: group.source,
          type: group.type,
          role: auth.formatRole(auth.RoleScheme.GRP, group.uid),
        });
      }
    }
    // Deep copy result to avoid incidental modification
    return Promise.resolve(JSON.parse(JSON.stringify(groups)));
  }
}
