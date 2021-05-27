import { ClientTaskState } from '@meeco/sdk';
import {
  ClientTaskQueueResponse1,
  ClientTaskStateEnum,
  ClientTaskWorkTypeEnum,
} from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

const testVaultToken = '2FPN4n5T68xy78i6HHuQ';

describe('client-task-queue:update', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .put('/client_task_queue', data =>
          data.client_tasks.every(x => !!x.id && x.state === ClientTaskState.InProgress)
        )
        .matchHeader('Authorization', testVaultToken)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response(ClientTaskStateEnum.InProgress));
    })
    .stdout()
    .stderr()
    .run([
      'client-task-queue:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      inputFixture('update-tasks.input.yaml'),
    ])
    .it('updates Client Tasks using YAML file states', ctx => {
      const expected = readFileSync(outputFixture('update-tasks-inprogress.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });

  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .put('/client_task_queue', data =>
          data.client_tasks.every(x => !!x.id && x.state === ClientTaskState.Todo)
        )
        .matchHeader('Authorization', testVaultToken)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response(ClientTaskStateEnum.Todo));
    })
    .stdout()
    .run([
      'client-task-queue:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '--set',
      ClientTaskState.Todo,
      inputFixture('update-tasks.input.yaml'),
    ])
    .it('updates Client Tasks using CLI flag', ctx => {
      const expected = readFileSync(outputFixture('update-tasks-todo.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function response(state: ClientTaskStateEnum): ClientTaskQueueResponse1 {
  return {
    client_tasks: ['1', '2', '3'].map(nId => ({
      id: nId,
      report: {},
      target_id: '1',
      state,
      additional_options: {},
      last_state_transition_at: new Date(1),
      created_at: new Date(1),
      work_type: ClientTaskWorkTypeEnum.UpdateItemShares,
    })),
  };
}
