import { expect } from '@oclif/test';
import { whitelistObject } from '../../src/util/whitelist-object';

describe('whitelist object', () => {
  it('whitelists an object', () => {
    expect(
      whitelistObject(['foo', 'baz'], {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
      })
    ).to.eql({
      foo: 'foo',
      baz: 'baz',
    });
  });

  it('does not add keys that do not exist', () => {
    expect(
      whitelistObject(['foo', 'bar'], {
        foo: 'foo',
      })
    ).to.eql({
      foo: 'foo',
    });
  });
});
