import { OrganizationsService } from '@meeco/sdk';
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
    .stub(OrganizationsService.prototype, 'create', create as any)
    .stdout()
    .stderr()
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

function create(organizationConfig) {
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
      created_at: new Date('2020-06-23T08:38:32.915Z'),
    },
    privateKey: '--PRIVATE_KEY--12324',
    publicKey: '--PUBLIC_KEY--ABCD',
  });
}
