import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { MOCK_NEXT_PAGE_AFTER } from '../../../src/util/constants';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('client-task-queue:list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/client_task_queue')
        .query({ supress_changing_state: true, state: 'todo' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response)
    )
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile, '-s', 'Todo'])
    .it('list tasks that client must perform', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });

  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/client_task_queue')
        .query({ supress_changing_state: true, state: 'todo' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/client_task_queue')
        .query({
          supress_changing_state: true,
          state: 'todo',
          next_page_after: MOCK_NEXT_PAGE_AFTER,
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2)
    )
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile, '-s', 'Todo'])
    .it('list all tasks for client when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
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
