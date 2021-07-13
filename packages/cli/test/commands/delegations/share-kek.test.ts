import { DelegationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('delegations:share-kek', () => {
  customTest
    .stdout()
    .stderr()
    .stub(DelegationService.prototype, 'shareKekWithDelegate', shareKekWithDelegate as any)
    .run([
      'delegations:share-kek',
      ...testUserAuth,
      ...testEnvironmentFile,
      '2322b5ed-7933-4ce4-9e1c-83f65eff79aa',
    ])
    .it('creates a delegation connection invitation', ctx => {
      const expected = readFileSync(outputFixture('delegations-share-kek.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function shareKekWithDelegate(authConfig, connectionId) {
  return Promise.resolve();
}
