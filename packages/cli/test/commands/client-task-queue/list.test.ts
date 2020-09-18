import { ClientTaskQueueService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

describe('client-task-queue:list', () => {
  customTest
    .stub(ClientTaskQueueService.prototype, 'list', list as any)
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile, '-s', 'Todo'])
    .it('list tasks that client must perform', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });

  customTest
    .stub(ClientTaskQueueService.prototype, 'listAll', listAll as any)
    .stdout()
    .run([
      'client-task-queue:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      ...testGetAll,
      '-s',
      'Todo',
    ])
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

function list() {
  return Promise.resolve(response);
}

function listAll() {
  return Promise.resolve(response);
}
