/**
 * Utilities for testing.
 */
import { assert } from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';



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


/**
 * Utility to assert the response is a valid webapi data package.
 */
export function expectPackage(data?: {}) {
  return (res: supertest.Response) => {
    if (res.status < 300 || res.status >= 400) {
      const pkg = res.body as webapi.Pkg<{}>;
      assert.isObject(pkg);
      if (res.status < 300) {
        if (!Array.isArray(pkg.data)) {
          assert.isObject(pkg.data);
        }
        assert.isUndefined(pkg.error);
        if (data) {
          // For some reason this function, deepInclude(),
          // is not in the type definitions (@types/chai@4.0.5)!
          (assert as any).deepInclude(pkg.data, data);
        }
      } else {
        assert.isObject(pkg.error);
        if (pkg.error) {
          assert.isNumber(pkg.error.code);
          assert.isString(pkg.error.message);
          assert.isNotEmpty(pkg.error.message);
          console.error(pkg.error.message); // tslint:disable-line
        }
      }
    }
  };
}
