/**
 * Test the application status REST API
 */
import { assert } from 'chai';

import * as auth from '../app/shared/auth';

import * as express from 'express';

type Request = express.Request;
// type Response = express.Response;
// type NextFunction = express.NextFunction;
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

  public getUser(req: Request): auth.IUser {
    let IUser = {username: this.username, roles: this.roles};
    return IUser;
  };
  public getRoles(req: Request): string[] | undefined {
    let roles = this.roles;
    return roles;
  };
  public authenticate(options?: any): RequestHandler {
    return this.authenticate(options);
  };

  public logout(req: Request): void {
    this.logout(req);
  };

  public getUsername(req: Request): string | undefined {
    let username = this.username;
    return username;
  };
}

describe('Auth Library', function () {

  describe('parseRole()', function () {

    it('Parse Role: grp:LAB.example.team', function() {
      let role = auth.parseRole('grp:LAB.example.team');
      assert.isDefined(role);
      if (role) {
        assert.deepEqual(role.scheme, 'GRP');
        assert.deepEqual(role.identifier, 'LAB.EXAMPLE.TEAM');
        assert.isUndefined(role.qualifier);
      }
    });

    it('Parse Role: grp:LAB.example.team#leader', function() {
      let role = auth.parseRole('grp:LAB.example.team#leader');
      assert.isDefined(role);
      if (role) {
        assert.deepEqual(role.scheme, 'GRP');
        assert.deepEqual(role.identifier, 'LAB.EXAMPLE.TEAM');
        assert.deepEqual(role.qualifier, 'LEADER');
      }
    });

    it('Parse Role: fake:lab.example.team', function () {
      assert.isUndefined(auth.parseRole('fake:lab.example.team'));
    });
  });

  describe('formatRole()', function () {

    it('Format Role: GRP:LAB.EXAMPLE.TEAM', function () {
      let expected = 'GRP:LAB.EXAMPLE.TEAM';
      assert.deepEqual(auth.formatRole('GRP', 'lab.example.team'), expected);
      assert.deepEqual(auth.formatRole({ scheme: 'GRP', identifier: 'lab.example.team' }), expected);
    });

    it('Format Role: GRP:LAB.EXAMPLE.TEAM#LEADER', function () {
      let expected = 'GRP:LAB.EXAMPLE.TEAM#LEADER';
      assert.deepEqual(auth.formatRole('GRP', 'lab.example.team', 'leader'), expected);
      assert.deepEqual(auth.formatRole({scheme: 'GRP', identifier: 'lab.example.team', qualifier: 'leader'}), expected);
    });
  });

  auth.setProvider(new TestProvider('andrew', ['ADM:FORG', 'SYS:GEN', 'grp:irs']));

  describe('hasRole()', function() {
    it('One Role', function () {
      assert.isTrue(auth.hasRole(<Request> {}, 'ADM:FORG'));
      assert.isTrue(auth.hasRole(<Request> {}, ['ADM:FORG']));
    });
    it('Two Roles', function () {
      assert.isTrue(auth.hasRole(<Request> {}, 'ADM:FORG', 'GRP:IRS'));
      assert.isTrue(auth.hasRole(<Request> {}, ['ADM:FORG', 'GRP:IRS']));
      assert.isTrue(auth.hasRole(<Request> {}, 'ADM:FORG', ['GRP:IRS']));
      assert.isTrue(auth.hasRole(<Request> {}, ['ADM:FORG'], 'GRP:IRS'));
    });
    it('Negative One Role', function () {
      assert.isFalse(auth.hasRole(<Request> {}, 'ADM:FUN'));
      assert.isFalse(auth.hasRole(<Request> {}, ['ADM:FUN']));
    });
    it('Negative One of Two Roles', function () {
      assert.isFalse(auth.hasRole(<Request> {}, 'ADM:FORG', 'SYS:FUN'));
      assert.isFalse(auth.hasRole(<Request> {}, ['ADM:FORG', 'SYS:FUN']));
      assert.isFalse(auth.hasRole(<Request> {}, 'ADM:FORG', ['SYS:FUN']));
      assert.isFalse(auth.hasRole(<Request> {}, ['ADM:FORG'], 'SYS:FUN'));
    });
    it('Negative Two of Three Roles', function () {
      assert.isFalse(auth.hasRole(<Request> {}, 'SYS:GEN', 'ADM:FORD', 'GRP:IRS'));
      assert.isFalse(auth.hasRole(<Request> {}, ['SYS:GEN', 'ADM:FORD', 'GRP:IRS']));
      assert.isFalse(auth.hasRole(<Request> {}, 'SYS:GEN', ['ADM:FORD',  'GRP:IRS']));
      assert.isFalse(auth.hasRole(<Request> {}, ['SYS:GEN'], 'ADM:FORD', 'GRP:IRS'));
      assert.isFalse(auth.hasRole(<Request> {}, ['SYS:GEN'], ['ADM:FORD'], ['GRP:IRS']));
    });
    it('One Role (Case Sensitivity)', function () {
      assert.isTrue(auth.hasRole(<Request> {}, 'aDM:forG'));
      assert.isTrue(auth.hasRole(<Request> {}, ['aDM:forG']));
    });
  });

  describe('hasAnyRole()', function () {
    let req = <Request> {};
    it('One Role', function() {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG']));
    });
    it('One of Two Roles', function () {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', ['ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], ['ADM:FUN']));
    });
    it('Two of Three Roles', function () {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', 'GRP:IRS', 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:IRS', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:IRS'], 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', ['GRP:IRS', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], ['GRP:IRS'], ['ADM:FUN']));
    });
    it('One of Three Roles', function () {
      assert.isTrue(auth.hasAnyRole(req, 'ADM:FORG', 'GRP:JKE', 'ADM:FUN'));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:JKE', 'ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG', 'GRP:JKE'], ['ADM:FUN']));
      assert.isTrue(auth.hasAnyRole(req, ['ADM:FORG'], ['GRP:JKE', 'ADM:FUN']));
    });
    it('Negative all of Three Roles', function () {
      assert.isFalse(auth.hasAnyRole(req, 'ADM:FAKE', 'GRP:JKE', 'ADM:FUN'));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE', 'GRP:JKE', 'ADM:FUN']));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE', 'GRP:JKE'], 'ADM:FUN'));
      assert.isFalse(auth.hasAnyRole(req, 'ADM:FAKE', ['GRP:JKE', 'ADM:FUN']));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE'], ['GRP:JKE'], ['ADM:FUN']));
    });
    it('Negative One Role', function() {
      assert.isFalse(auth.hasAnyRole(req, 'ADM:FAKE'));
      assert.isFalse(auth.hasAnyRole(req, ['ADM:FAKE']));
    });
    it('One Role (Case Sensitivity)', function () {
      assert.isTrue(auth.hasAnyRole(req, 'adm:forg'));
      assert.isTrue(auth.hasAnyRole(req, ['adm:forg']));
    });
  });

  describe('hasUsername()', function () {
    let req = <Request> {};
    it('One Username', function () {
      assert.isTrue(auth.hasUsername(req, 'andrew'));
      assert.isTrue(auth.hasUsername(req, ['andrew']));
    });
    it('Three of Usernames', function () {
      assert.isTrue(auth.hasUsername(req, 'andrew', 'dylan', 'matt'));
      assert.isTrue(auth.hasUsername(req, ['andrew', 'dylan', 'matt']));
      assert.isTrue(auth.hasUsername(req, ['andrew', 'dylan'], 'matt'));
      assert.isTrue(auth.hasUsername(req, 'andrew', ['dylan', 'matt']));
      assert.isTrue(auth.hasUsername(req, ['andrew'], ['dylan'], ['matt']));
    });
    it('Negative One Username', function () {
      assert.isFalse(auth.hasUsername(req, 'matt'));
      assert.isFalse(auth.hasUsername(req, ['matt']));
    });
    it('Negative Three Usernames', function () {
      assert.isFalse(auth.hasUsername(req, 'matt', 'dylan', 'jeb'));
      assert.isFalse(auth.hasUsername(req, ['matt', 'dylan', 'jeb']));
      assert.isFalse(auth.hasUsername(req, ['matt', 'dylan'], ['jeb']));
      assert.isFalse(auth.hasUsername(req, ['matt', 'dylan'], ['jeb']));
      assert.isFalse(auth.hasUsername(req, ['matt'], ['dylan'], ['jeb']));
    });
    it('One Username (Case Sensitivity)', function () {
      assert.isTrue(auth.hasUsername(req, 'anDreW'));
      assert.isTrue(auth.hasUsername(req, ['anDreW']));
    });
  });
});
