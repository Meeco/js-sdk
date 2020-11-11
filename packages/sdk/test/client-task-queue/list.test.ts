import { ClientTaskQueueGetStateEnum } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { ClientTaskQueueService } from '../../src/services/client-task-queue-service';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('ClientTaskService.list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/client_task_queue')
        .query({ change_state: true, state: 'todo' })
        .matchHeader('Authorization', testUserAuth.vault_access_token)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response)
    )
    .it('list tasks that the client must perform', async () => {
      const result = await new ClientTaskQueueService(
        environment
      ).list(testUserAuth.vault_access_token, true, [ClientTaskQueueGetStateEnum.Todo]);

      const expected = getOutputFixture('list-client-task-queue.output.json');
      expect(result.client_tasks).to.deep.members(expected);
    });
});

describe('ClientTaskService.listAll', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/client_task_queue')
        .query({ change_state: true, state: 'todo' })
        .matchHeader('Authorization', testUserAuth.vault_access_token)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/client_task_queue')
        .query({
          change_state: true,
          state: 'todo',
          next_page_after: MOCK_NEXT_PAGE_AFTER,
        })
        .matchHeader('Authorization', testUserAuth.vault_access_token)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2)
    )
    .it('list all tasks for client when paginated', async () => {
      const result = await new ClientTaskQueueService(
        environment
      ).listAll(testUserAuth.vault_access_token, true, [ClientTaskQueueGetStateEnum.Todo]);

      const expected = getOutputFixture('list-client-task-queue.output.json');
      expect(result.client_tasks).to.deep.members(expected);
    });
});

const response = {
  client_tasks: [
    {
      id: 'a',
      state: 'todo',
      work_type: 'update_share',
      target_id: 'share_item_id_a',
      additional_options: {},
      last_state_transition_at: new Date(1),
      report: {},
      created_at: new Date(1),
    },
    {
      id: 'b',
      state: 'todo',
      work_type: 'update_share',
      target_id: 'share_item_id_b',
      additional_options: {},
      last_state_transition_at: new Date(1),
      report: {},
      created_at: new Date(1),
    },
  ],
  meta: [],
};

const responsePart1 = {
  ...response,
  client_tasks: [response.client_tasks[0]],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: [{ next_page_exists: true }],
};

const responsePart2 = {
  ...response,
  client_tasks: [response.client_tasks[1]],
};
