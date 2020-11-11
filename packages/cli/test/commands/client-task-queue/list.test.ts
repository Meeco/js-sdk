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

  const responseEachType = {
    client_tasks: [
      {
        id: 'a',
        state: ClientTaskState.Todo,
        work_type: 'update_share',
        target_id: 'share_item_id_a',
        additional_options: {},
        last_state_transition_at: new Date(1),
        report: {},
        created_at: new Date(1),
      },
      {
        id: 'b',
        state: ClientTaskState.InProgress,
        work_type: 'update_share',
        target_id: 'share_item_id_b',
        additional_options: {},
        last_state_transition_at: new Date(1),
        report: {},
        created_at: new Date(1),
      },
      {
        id: 'c',
        state: ClientTaskState.Done,
        work_type: 'update_share',
        target_id: 'share_item_id_b',
        additional_options: {},
        last_state_transition_at: new Date(1),
        report: {},
        created_at: new Date(1),
      },
      {
        id: 'd',
        state: ClientTaskState.Failed,
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
    .stub(ClientTaskQueueService.prototype, 'list', sinon.stub().resolves(responseEachType))
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile])
    .it('lists all types of Client Tasks by default', ctx => {
      const expected = readFileSync(
        outputFixture('list-client-task-queue-many.output.yaml'),
        'utf-8'
      );
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

  const listStub = sinon.stub().resolves(response);

  customTest
    .stub(ClientTaskQueueService.prototype, 'list', listStub)
    .stdout()
    .run([
      'client-task-queue:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-s',
      [ClientTaskState.Todo, ClientTaskState.InProgress].join(),
    ])
    .it('filters with multiple states specified', () => {
      expect(listStub.lastCall.args[2]).to.have.members([
        ClientTaskState.Todo,
        ClientTaskState.InProgress,
      ]);
    });

  const ignoreStub = sinon.stub().resolves(response);

  customTest
    .stub(ClientTaskQueueService.prototype, 'list', ignoreStub)
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile, '-s', 'donkey'])
    .it('ignores invalid state filters', () => {
      // tslint:disable-next-line:no-unused-expression
      expect(ignoreStub.lastCall.args[2]).to.be.undefined;
    });
});
