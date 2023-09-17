import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { MOCK_NEXT_PAGE_AFTER } from '../../../src/util/constants';
import {
  customTest,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

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
          ...response,
          organizations: response.organizations.filter(f => f.status === 'validated'),
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
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/organizations')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2);
    })
    .run(['organizations:list', ...testUserAuth, ...testEnvironmentFile, ...testGetAll])
    .it('shows a list of validated organizations when paginated', ctx => {
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
          ...response,
          organizations: response.organizations.filter(f => f.status === 'requested'),
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
          ...response,
          organizations: response.organizations.filter(
            f => f.status === 'validated' && f.name === 'Member mode Inc.'
          ),
        });
    })
    .run(['organizations:list', '-m', 'member', ...testUserAuth, ...testEnvironmentFile])
    .it('shows a list of organizations the user is a member of', ctx => {
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
  services: [],
  meta: {},
};

const responsePart1 = {
  organizations: [response.organizations[1]],
  services: [],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: { order: 'asc' },
};

const responsePart2 = {
  ...response,
  organizations: [response.organizations[2]],
};
