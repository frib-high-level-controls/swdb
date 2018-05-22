/**
 * Test the model utilities
 */
import { assert } from 'chai';

import * as models from '../app/shared/models';

describe('Test Model utilities', () => {

  it('matchAll', () => {
    assert.isNotNull(models.matchAll('One*Three').exec('One*Three'));
    assert.isNull(models.matchAll('One*Three').exec('OneTwoThree'));
  });


  it('matchStart', () => {
    assert.isNotNull(models.matchStart('One*Three').exec('One*Three'));
    assert.isNotNull(models.matchStart('One*Three').exec('One*ThreeFour'));
    assert.isNull(models.matchStart('One*Three').exec('ZeroOne*Three'));
  });

  it('matchEnd', () => {
    assert.isNotNull(models.matchEnd('One*Three').exec('One*Three'));
    assert.isNotNull(models.matchEnd('One*Three').exec('ZeroOne*Three'));
    assert.isNull(models.matchEnd('One*Three').exec('One*ThreeFour'));
  });

  it('isPattern', () => {
    assert.isTrue(models.isPattern('One*Three'));
    assert.isTrue(models.isPattern('*OneThree'));
    assert.isTrue(models.isPattern('*One*Three'));
    assert.isFalse(models.isPattern('OneTwoThree'));
  });

  it('matchPattern', () => {
    assert.isNotNull(models.matchPattern('One*Three').exec('One*Three'));
    assert.isNotNull(models.matchPattern('One*Three').exec('OneTwoThree'));
    assert.isNotNull(models.matchPattern('One*Three').exec('OneThree'));
    assert.isNotNull(models.matchPattern('*One*Three*').exec('ZeroOneTwoThreeFour'));
    assert.isNull(models.matchEnd('One*Three').exec('OneTwoFour'));
  });
});
