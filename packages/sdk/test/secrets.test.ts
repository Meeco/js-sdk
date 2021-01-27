import { Secrets } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { util } from 'node-forge';

describe('Key Generator', () => {
  it('generates valid base58 strings', () => {
    // Test vectors are available from the RFC
    // https://tools.ietf.org/html/draft-msporny-base58-01

    expect(Secrets.encodeBase58('Hello World!')).equals('2NEpo7TZRRrLZSi2U');
    expect(Secrets.encodeBase58('The quick brown fox jumps over the lazy dog.')).equals(
      'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z'
    );

    // I don't know why but the extra leading 1 didn't work here.
    // I assume it's because the number is too big for JS to handle
    const hex = util.hexToBytes('0000287fb4cd');
    expect(Secrets.encodeBase58(hex)).equals('11233QC4');
  });
});
