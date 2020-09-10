import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organizations:list', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          organizations: response.organizations.filter(f => f.status === 'validated'),
          services: [],
        });
    })
    .run(['organizations:list', ...testUserAuth, ...testEnvironmentFile])
    .it('shows a list of validated organizations', ctx => {
      const expected = readFileSync(
        outputFixture('list-organizations-validated.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .query({ mode: 'requested' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          organizations: response.organizations.filter(f => f.status === 'requested'),
          services: [],
        });
    })
    .run(['organizations:list', '-m', 'requested', ...testUserAuth, ...testEnvironmentFile])
    .it('shows a list of requested organizations requested by logged in user ', ctx => {
      const expected = readFileSync(
        outputFixture('list-organizations-requested.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .query({ mode: 'member' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          organizations: response.organizations.filter(
            f => f.status === 'validated' && f.name === 'Member mode Inc.'
          ),
          services: [],
        });
    })
    .run(['organizations:list', '-m', 'member', ...testUserAuth, ...testEnvironmentFile])
    .it('shows a list of requested organizations requested by logged in user ', ctx => {
      const expected = readFileSync(
        outputFixture('list-organizations-validated-member.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

const response = {
  organizations: [
    {
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
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'InfoTech Inc.',
      description: 'My InfoTech handling organization',
      url: 'https://infotech.example.com',
      email: 'admin@infotech.example.com',
      status: 'validated',
      requestor_id: '00000000-0000-0000-0000-000000000001',
      validated_by_id: '00000000-0000-0000-0000-000000000011',
      agent_id: null,
      validated_at: '2020-06-25T08:38:32.915Z',
      created_at: '2020-06-23T08:38:32.915Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Member mode Inc.',
      description: 'My Member mode handling organization',
      url: 'https://membermode.example.com',
      email: 'admin@membermode.example.com',
      status: 'validated',
      requestor_id: '00000000-0000-0000-0000-000000000002',
      validated_by_id: '00000000-0000-0000-0000-000000000022',
      agent_id: null,
      validated_at: '2020-06-25T08:38:32.915Z',
      created_at: '2020-06-23T08:38:32.915Z',
    },
  ],
};
