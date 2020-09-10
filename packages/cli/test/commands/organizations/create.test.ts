import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organizations:create', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organizations:create',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-c',
      inputFixture('create-organization.input.yaml'),
    ])
    .it('Requests the creation of a new organization', ctx => {
      const expected = readFileSync(outputFixture('create-organization.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

const response = {
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
    created_at: '2020-06-23T08:38:32.915Z',
  },
};

function mockVault(api) {
  api
    .post('/organizations', {
      name: 'SuperData Inc.',
      description: 'My super data handling organization',
      url: 'https://superdata.example.com',
      email: 'admin@superdata.example.com',
      public_key: '--PUBLIC_KEY--ABCD',
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}
