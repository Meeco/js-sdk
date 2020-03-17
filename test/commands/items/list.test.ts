import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/items')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          items: [
            {
              name: 'My Car',
              slot_ids: ['make_model']
            },
            {
              name: 'My House',
              slot_ids: ['add']
            }
          ],
          slots: [
            {
              id: 'make_model',
              name: 'Make and Model',
              value: 'Tesla Model S'
            },
            {
              id: 'add',
              name: 'address',
              value: '123 Fake Street'
            }
          ]
        })
    )
    .stdout()
    .run(['items:list', ...testUserAuth, ...testEnvironmentFile])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});
