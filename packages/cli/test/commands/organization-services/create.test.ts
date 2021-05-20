import { OrganizationServicesService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organization-services:create', () => {
  customTest
    .stub(OrganizationServicesService.prototype, 'create', create as any)
    .stdout()
    .stderr()
    .run([
      'organization-services:create',
      'organization_id',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-c',
      inputFixture('create-organization-service.input.yaml'),
    ])
    .it('Requests the creation of a new organization service', ctx => {
      const expected = readFileSync(
        outputFixture('create-organization-services.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function create(organizationId, service) {
  return Promise.resolve({
    service: {
      id: 'f71272a3-d26b-4b85-9b0b-b3fd24c4ea0a',
      name: 'Twitter Service',
      description: 'Fetch all twitter data',
      contract: {
        name: 'sample contract',
      },
      status: 'requested',
      organization_id: 'e2fed464-878b-4d4b-9017-99abc50504ed',
      validated_by_id: null,
      agent_id: null,
      validated_at: null,
      created_at: new Date('2020-07-02T05:47:44.983Z'),
    },
    privateKey: {
      pem: '--PRIVATE_KEY--12324',
    },
    publicKey: {
      key: '--PUBLIC_KEY--ABCD',
    },
  });
}
