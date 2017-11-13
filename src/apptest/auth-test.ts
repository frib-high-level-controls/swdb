/**
 * Test the application status REST API
 */
import { assert } from 'chai';

import * as auth from '../app/shared/auth';


describe('Auth Library', function () {

  describe('Role Utilities', function () {

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
});
