/**
 * Utilities for testing.
 */
import { assert } from 'chai';
import * as dbg from 'debug';
import * as express from 'express';
import * as supertest from 'supertest';

const debug = dbg('webapp:testing');


/**
 *  Utility to get an authenticated agent for the specified user.
 */
export async function requestFor(app: express.Application, username?: string, password?: string, path?: string) {
  const agent = supertest.agent(app);
  if (username) {
    await agent
    .get(path || '/login')
    .auth(username, password || 'Pa5w0rd')
    .expect(302);
  }
  return agent;
}

type CheckPackageChecker = (res: supertest.Response) => Promise<void> | void;
interface CheckPackageOptions { equal?: boolean; ordered?: boolean; }

/**
 * Utility to assert the response is a valid webapi data package.
 */
export function checkPackage(data?: {}, options?: CheckPackageOptions): CheckPackageChecker {
  return (res: supertest.Response) => {
    options = options || {};

    if (res.status >= 300 && res.status < 400) {
      // ignore redirects
      return;
    }

    const pkg = res.body as webapi.Pkg<{}>;
    assert.isObject(pkg);

    if (res.status >= 400) {
      assert.isObject(pkg.error);
      if (pkg.error) {
        assert.isNumber(pkg.error.code);
        assert.isString(pkg.error.message);
        assert.isNotEmpty(pkg.error.message);
        debug('Package error: %s', pkg.error.message);

        if (!Array.isArray(pkg.error.errors)) {
          assert.isUndefined(pkg.error.errors);
          return;
        }
        for (const error of pkg.error.errors) {
          assert.isString(error.message);
          assert.isNotEmpty(error.message);
          assert.isString(error.location);
          assert.isNotEmpty(error.location);
          debug('Package error detail (%s): %s', error.location, error.message);
        }
      }
      return;
    }

    assert.isUndefined(pkg.error);
    assert.isDefined(pkg.data);

    if (Array.isArray(data)) {
      if (!Array.isArray(pkg.data)) {
        assert.isArray(pkg.data);
        return;
      }
      if (options.equal) {
        if (options.ordered) {
          assert.sameDeepOrderedMembers(pkg.data, data);
        } else {
          assert.sameDeepMembers(pkg.data, data);
        }
      } else {
        if (options.ordered) {
          assert.includeDeepOrderedMembers(pkg.data, data);
        } else {
          assert.includeDeepMembers(pkg.data, data);
        }
      }
      return;
    }

    if (typeof data === 'function') {
      return data(pkg.data);
    }

    if (data !== undefined) {
      if (options.equal) {
        assert.deepEqual(pkg.data, data);
      } else {
        assert.deepInclude(pkg.data, data);
      }
      return;
    }
  };
}


/**
 * Maintained for compatiblity
 */
export const expectPackage = checkPackage;
