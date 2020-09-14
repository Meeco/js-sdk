import { expect } from '@oclif/test';
import { ClientTaskQueueService, State } from '../../src/services/client-task-queue-service';
import { customTest, environment, getOutputFixture, testUserAuthFixture } from '../test-helpers';

describe('Client-task-queue list', () => {
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
              created_at: new Date(0),
            },
            {
              id: 'b',
              state: 'todo',
              work_type: 'update_share',
              target_id: 'share_item_id_b',
              additional_options: {},
              last_state_transition_at: new Date(0),
              report: {},
              created_at: new Date(0),
            },
          ],
        })
    )
    .it('list task that client suppose to perform', async () => {
      const result = await new ClientTaskQueueService(environment).list(
        testUserAuthFixture.metadata.vault_access_token,
        true,
        State.Todo
      );

      const expected = getOutputFixture('list-client-task-queue.output.yaml');
      expect(result.client_tasks).to.deep.members(expected.spec);
    });
});
