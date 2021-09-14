import { DelegationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('delegations:accept-kek', () => {
  customTest
    .stdout()
    .stderr()
    .stub(DelegationService.prototype, 'reencryptSharedKek', reencryptSharedKek as any)
    .run([
      'delegations:accept-kek',
      ...testUserAuth,
      ...testEnvironmentFile,
      'a2b78a17-8033-4afc-bcbe-728a4386fbc4',
    ])
    .it('creates a delegation connection invitation', ctx => {
      const expected = readFileSync(outputFixture('delegations-accept-kek.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function reencryptSharedKek(authConfig, connectionId) {
  return Promise.resolve();
}
