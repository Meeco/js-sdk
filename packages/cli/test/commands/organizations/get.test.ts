import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organizations:get', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run(['organizations:get', 'id', ...testUserAuth, ...testEnvironmentFile])
    .it('returns a validated or requested by logged in user organization ', ctx => {
      const expected = readFileSync(outputFixture('get-organization.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function vaultAPIFactory(environment) {
  return (authConfig) => ({
    OrganizationsForVaultUsersApi: {
      organizationsIdGet: (id) => {
        return Promise.resolve({
          organization: {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'SuperData Inc.',
            description: 'My super data handling organization',
            url: 'https://superdata.example.com',
            email: 'admin@superdata.example.com',
            status: 'requested',
            requestor_id: '00000000-0000-0000-0000-000000000000',
            validated_by_id: null,
            agent_id: null,
            validated_at: null,
            created_at: new Date('2020-06-23T08:38:32.915Z')
          },
          services: []
        });
      }
    }
  });
}
