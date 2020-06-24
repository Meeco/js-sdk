import { State } from '@meeco/sdk';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('client-task-queue:update', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'client-task-queue:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('update-client-task.input.yaml')
    ])
    .it('Updates the client task', ctx => {
      const expected = readFileSync(outputFixture('update-client-task.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

const response = {
  client_tasks: [
    {
      id: 'client_task_1',
      state: State.Done,
      work_type: 'update_share',
      target_id: 'share_id_1',
      additional_options: {},
      last_state_transition_at: new Date(0),
      report: {},
      created_at: new Date(0)
    },
    {
      id: 'client_task_2',
      state: State.Done,
      work_type: 'update_share',
      target_id: 'share_id_2',
      additional_options: {},
      last_state_transition_at: new Date(0),
      report: {},
      created_at: new Date(0)
    }
  ]
};

function mockVault(api) {
  api
    .get('/client_task_queue')
    .query({ supress_changing_state: true, state: 'todo' })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      client_tasks: [{}, {}]
    });
  api
    .get('/client_task_queue')
    .query({ supress_changing_state: true, state: 'in_progress' })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      client_tasks: [{}, {}, {}]
    });
  api
    .put('/client_task_queue', {
      client_tasks: [
        {
          id: 'client_task_1',
          state: State.Done,
          report: {}
        },
        {
          id: 'client_task_2',
          state: State.Done,
          report: {}
        }
      ]
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}
