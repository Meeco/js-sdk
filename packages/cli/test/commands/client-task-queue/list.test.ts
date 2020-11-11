import { ClientTaskQueueService } from '@meeco/sdk';
import { ClientTaskQueueGetStateEnum as ClientTaskState } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import sinon from 'sinon';
import {
  customTest,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

describe('client-task-queue:list', () => {
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

  customTest
    .stub(ClientTaskQueueService.prototype, 'list', sinon.stub().resolves(response))
    .stdout()
    .run([
      'client-task-queue:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-s',
      ClientTaskState.Todo,
    ])
    .it('lists Client Tasks', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });

  customTest
    .stub(ClientTaskQueueService.prototype, 'listAll', sinon.stub().resolves(response.client_tasks))
    .stdout()
    .run([
      'client-task-queue:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      ...testGetAll,
      '-s',
      ClientTaskState.Todo,
    ])
    .it('list all tasks for client when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});
