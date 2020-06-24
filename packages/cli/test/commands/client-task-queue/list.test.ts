import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('client-task-queue:list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/client_task_queue')
        .query({ supress_changing_state: true, state: 'todo' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          client_tasks: [
            {
              id: 'a',
              state: 'todo',
              work_type: 'update_share',
              target_id: 'share_item_id_a',
              additional_options: {},
              last_state_transition_at: new Date(0),
              report: {},
              created_at: new Date(0)
            },
            {
              id: 'b',
              state: 'todo',
              work_type: 'update_share',
              target_id: 'share_item_id_b',
              additional_options: {},
              last_state_transition_at: new Date(0),
              report: {},
              created_at: new Date(0)
            }
          ]
        })
    )
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile, '-s', 'Todo'])
    .it('list task that client suppose to perform', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});
