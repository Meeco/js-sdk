import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-services:list', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations/organization_id/requested_services')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .run(['organization-services:list', 'organization_id', ...testUserAuth, ...testEnvironmentFile])
    .it('shows a list of validated organizations', ctx => {
      const expected = readFileSync(
        outputFixture('list-organization-services-requested.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

const response = {
  services: [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Life Paths Twitter Service',
      description: 'Life Paths Twitter connect',
      contract: { name: 'sample contract' },
      organization_id: '00000000-0000-0000-0000-000000000011',
      validated_by_id: null,
      validated_at: null,
      agent_id: null,
      created_at: '2020-07-02T05:47:44.983Z',
      status: 'requested',
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Life Paths Facebook Service',
      description: 'Life Path Facebook page connect',
      contract: { name: 'sample contract' },
      organization_id: '00000000-0000-0000-0000-000000000011',
      validated_by_id: null,
      validated_at: null,
      agent_id: null,
      created_at: '2020-07-02T05:47:44.983Z',
      status: 'requested',
    },
  ],
};
