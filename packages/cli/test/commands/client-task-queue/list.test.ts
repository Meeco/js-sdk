import { ClientTaskQueueService } from '@meeco/sdk';
import { ClientTaskQueueResponse } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('client-task-queue:list', () => {
  customTest
    .stub(ClientTaskQueueService.prototype, 'list', list as any)
    .stdout()
    .run(['client-task-queue:list', ...testUserAuth, ...testEnvironmentFile, '-s', 'Todo'])
    .it('list task that client suppose to perform', ctx => {
      const expected = readFileSync(outputFixture('list-client-task-queue.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function list(
  vaultAccessToken: string,
  isChangingStateSuppressed: boolean,
  clientTaskQueueState: any
): Promise<ClientTaskQueueResponse> {
  return Promise.resolve({
    next_page_after: null,
    meta: [],
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
    ],
  });
}