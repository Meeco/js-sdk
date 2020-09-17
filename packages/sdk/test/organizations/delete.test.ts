import { vaultAPIFactory } from '../../src/util/api-factory';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('Organizations delete', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .delete('/organizations/id')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(204)
    )
    .it('delete a requested organization', async () => {
      await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsManagingOrganizationsApi.organizationsIdDelete('id');
    });
});
