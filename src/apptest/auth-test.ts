/**
 * Test the application status REST API
 */
import { assert } from 'chai';

import * as auth from '../app/shared/auth';

import * as express from 'express';

type Request = express.Request;
type RequestHandler = express.RequestHandler;

/**
 * Test AuthProvider that ignores the request and
 * simply returns the specified username and roles.
 */
class TestProvider extends auth.AbstractProvider  {
  private username: string;
  private roles: string[];

  constructor(name: string, roles: string[]) {
    super();
    this.username = name;
    this.roles = roles;
  }

  public initialize(): RequestHandler {
    return (req, res, next) => {
      next();
    };
  }

  public authenticate(options?: any): RequestHandler {
    return (req, res, next) => {
      next();
    };
  }

  public getUser(req: Request): auth.IUser {
    return {
      username: this.username,
      roles: this.roles,
    };
  }

  public getRoles(req: Request): string[] | undefined {
    return this.roles;
  }

  public logout(req: Request): void {
    this.logout(req);
  }

  public getUsername(req: Request): string | undefined {
    return this.username;
  }
}

describe('Auth Library', () => {

  describe('parseRole()', () => {

    it('Parse Role: grp:LAB.example.team', () => {
      const role = auth.parseRole('grp:LAB.example.team');
      assert.isDefined(role);
      if (role) {
        assert.deepEqual(role.scheme, 'GRP');
        assert.deepEqual(role.identifier, 'LAB.EXAMPLE.TEAM');
        assert.isUndefined(role.qualifier);
      }
    });

    it('Parse Role: grp:LAB.example.team#leader', () => {
      const role = auth.parseRole('grp:LAB.example.team#leader');
      assert.isDefined(role);
      if (role) {
        assert.deepEqual(role.scheme, 'GRP');
        assert.deepEqual(role.identifier, 'LAB.EXAMPLE.TEAM');
        assert.deepEqual(role.qualifier, 'LEADER');
      }
    });

    it('Parse Role: fake:lab.example.team', () => {
      assert.isUndefined(auth.parseRole('fake:lab.example.team'));
    });
  });

  describe('formatRole()', () => {

    it('Format Role: GRP:LAB.EXAMPLE.TEAM', () => {
      const expected = 'GRP:LAB.EXAMPLE.TEAM';
      const role = { scheme: auth.RoleScheme.GRP, identifier: 'lab.example.team' };
      assert.deepEqual(auth.formatRole(role.scheme, role.identifier), expected);
      assert.deepEqual(auth.formatRole(role), expected);
    });

    it('Format Role: GRP:LAB.EXAMPLE.TEAM#LEADER', () => {
      const expected = 'GRP:LAB.EXAMPLE.TEAM#LEADER';
      const role = { scheme: auth.RoleScheme.GRP, identifier: 'lab.example.team', qualifier: 'leader' };
      assert.deepEqual(auth.formatRole(role.scheme, role.identifier, role.qualifier), expected);
      assert.deepEqual(auth.formatRole(role), expected);
    });
  });

  auth.setProvider(new TestProvider('andrew', ['ADM:FORG', 'SYS:GEN', 'grp:irs']));

  describe('hasRole()', () => {
    it('One Role', () => {
      assert.isTrue(auth.hasRole({} as any, 'ADM:FORG'));
      assert.isTrue(auth.hasRole({} as any, ['ADM:FORG']));
    });
    it('Two Roles', () => {
      assert.isTrue(auth.hasRole({} as any, 'ADM:FORG', 'GRP:IRS'));
      assert.isTrue(auth.hasRole({} as any, ['ADM:FORG', 'GRP:IRS']));
      assert.isTrue(auth.hasRole({} as any, 'ADM:FORG', ['GRP:IRS']));
      assert.isTrue(auth.hasRole({} as any, ['ADM:FORG'], 'GRP:IRS'));
    });
    it('Negative One Role', () => {
      assert.isFalse(auth.hasRole({} as any, 'ADM:FUN'));
      assert.isFalse(auth.hasRole({} as any, ['ADM:FUN']));
    });
    it('Negative One of Two Roles', () => {
      assert.isFalse(auth.hasRole({} as any, 'ADM:FORG', 'SYS:FUN'));
      assert.isFalse(auth.hasRole({} as any, ['ADM:FORG', 'SYS:FUN']));
      assert.isFalse(auth.hasRole({} as any, 'ADM:FORG', ['SYS:FUN']));
      assert.isFalse(auth.hasRole({} as any, ['ADM:FORG'], 'SYS:FUN'));
    });
    it('Negative Two of Three Roles', () => {
      assert.isFalse(auth.hasRole({} as any, 'SYS:GEN', 'ADM:FORD', 'GRP:IRS'));
      assert.isFalse(auth.hasRole({} as any, ['SYS:GEN', 'ADM:FORD', 'GRP:IRS']));
      assert.isFalse(auth.hasRole({} as any, 'SYS:GEN', ['ADM:FORD',  'GRP:IRS']));
      assert.isFalse(auth.hasRole({} as any, ['SYS:GEN'], 'ADM:FORD', 'GRP:IRS'));
      assert.isFalse(auth.hasRole({} as any, ['SYS:GEN'], ['ADM:FORD'], ['GRP:IRS']));
    });
    it('One Role (Case Sensitivity)', () => {
      assert.isTrue(auth.hasRole({} as any, 'aDM:forG'));
      assert.isTrue(auth.hasRole({} as any, ['aDM:forG']));
    });
  });

  describe('hasAnyRole()', () => {
    const req = {} as any;
    it('One Role', () => {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG']));
    });
    it('One of Two Roles', () => {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', ['ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], ['ADM:FUN']));
    });
    it('Two of Three Roles', () => {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', 'GRP:IRS', 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:IRS', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:IRS'], 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', ['GRP:IRS', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], ['GRP:IRS'], ['ADM:FUN']));
    });
    it('One of Three Roles', () => {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', 'GRP:JKE', 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:JKE', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:JKE'], ['ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], ['GRP:JKE', 'ADM:FUN']));
    });
    it('Negative all of Three Roles', () => {
      assert.isFalse(auth.hasAnyRole(req, 'ADM:FAKE', 'GRP:JKE', 'ADM:FUN'));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE', 'GRP:JKE', 'ADM:FUN']));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE', 'GRP:JKE'], 'ADM:FUN'));
      assert.isFalse(auth.hasAnyRole(req, 'ADM:FAKE', ['GRP:JKE', 'ADM:FUN']));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE'], ['GRP:JKE'], ['ADM:FUN']));
    });
    it('Negative One Role', () => {
      assert.isFalse(auth.hasAnyRole(req, 'ADM:FAKE'));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE']));
    });
    it('One Role (Case Sensitivity)', () => {
      assert.isTrue(auth.hasAnyRole(req, 'adm:forg'));
      assert.isTrue(auth.hasAnyRole(req, ['adm:forg']));
    });
  });

  describe('hasUsername()', () => {
    const req = {} as any;
    it('One Username', () => {
      assert.isTrue(auth.hasUsername(req, 'andrew'));
      assert.isTrue(auth.hasUsername(req, ['andrew']));
    });
    it('Three of Usernames', () => {
      assert.isTrue(auth.hasUsername(req, 'andrew', 'dylan', 'matt'));
      assert.isTrue(auth.hasUsername(req, ['andrew', 'dylan', 'matt']));
      assert.isTrue(auth.hasUsername(req, ['andrew', 'dylan'], 'matt'));
      assert.isTrue(auth.hasUsername(req, 'andrew', ['dylan', 'matt']));
      assert.isTrue(auth.hasUsername(req, ['andrew'], ['dylan'], ['matt']));
    });
    it('Negative One Username', () => {
      assert.isFalse(auth.hasUsername(req, 'matt'));
      assert.isFalse(auth.hasUsername(req, ['matt']));
    });
    it('Negative Three Usernames', () => {
      assert.isFalse(auth.hasUsername(req, 'matt', 'dylan', 'jeb'));
      assert.isFalse(auth.hasUsername(req, ['matt', 'dylan', 'jeb']));
      assert.isFalse(auth.hasUsername(req, ['matt', 'dylan'], ['jeb']));
      assert.isFalse(auth.hasUsername(req, ['matt', 'dylan'], ['jeb']));
      assert.isFalse(auth.hasUsername(req, ['matt'], ['dylan'], ['jeb']));
    });
    it('One Username (Case Sensitivity)', () => {
      assert.isTrue(auth.hasUsername(req, 'anDreW'));
      assert.isTrue(auth.hasUsername(req, ['anDreW']));
    });
  });
});
