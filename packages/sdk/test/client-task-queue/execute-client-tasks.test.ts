import { ClientTaskState, ItemService, ShareService } from '@meeco/sdk';
import { ClientTask, Item, Slot } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import * as nock from 'nock';
import sinon from 'sinon';
import { ClientTaskQueueService } from '../../src/services/client-task-queue-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('ClientTaskQueueService.execute', () => {
  const updateStub = sinon.stub();
  updateStub.withArgs(testUserAuth, 'a').returns({});

  customTest
    .stub(ItemService.prototype, 'get', getSharedItem as any)
    .stub(ShareService.prototype, 'updateSharedItem', updateStub)
    .nock('https://sandbox.meeco.me/vault', stubVault)
    .mockCryppo()
    .it('executes and updates ClientTasks', async () => {
      const result = await new ClientTaskQueueService(environment).execute(testUserAuth, [
        task('a', ClientTaskState.Todo),
      ]);

      expect(result.completed.length).to.equal(1);
      expect(result.failed.length).to.equal(0);
    });

  customTest.it('does not execute in_progress tasks', async () => {
    new ClientTaskQueueService(environment)
      .execute(testUserAuth, [task('a', ClientTaskState.InProgress)])
      .then(() => expect.fail())
      .catch(e => expect(e).to.be.ok);
  });

  customTest.it('does not execute done tasks', async () => {
    new ClientTaskQueueService(environment)
      .execute(testUserAuth, [task('a', ClientTaskState.Done)])
      .then(() => expect.fail())
      .catch(e => expect(e).to.be.ok);
  });

  customTest
    .stub(ItemService.prototype, 'get', getSharedItem as any)
    .stub(ShareService.prototype, 'updateSharedItem', updateStub)
    .nock('https://sandbox.meeco.me/vault', stubVault)
    .mockCryppo()
    .it('executes failed tasks', async () => {
      const result = await new ClientTaskQueueService(environment).execute(testUserAuth, [
        task('a', ClientTaskState.Failed),
      ]);

      expect(result.completed.length).to.equal(1);
      expect(result.failed.length).to.equal(0);
    });
});

const shareId = 'share_id';
const itemId = 'share_item_id_a';

function task(id: string, state: ClientTaskState): ClientTask {
  return {
    id,
    state,
    work_type: 'update_item_shares',
    target_id: itemId,
    additional_options: {},
    last_state_transition_at: new Date(1),
    report: {},
    created_at: new Date(1),
  };
}

const doneTasksResult = [task('a', ClientTaskState.Done)];
const inProgressTasksResult = [task('a', ClientTaskState.InProgress)];

function stubVault(api: nock.Scope) {
  api
    .put(`/client_task_queue`, (body: any) =>
      body.client_tasks.every(x => x.state === ClientTaskState.InProgress)
    )
    .matchHeader('Authorization', testUserAuth.vault_access_token)
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, { client_tasks: inProgressTasksResult });

  api
    .put(`/client_task_queue`, (body: any) =>
      body.client_tasks.every(x => x.state === ClientTaskState.Done)
    )
    .matchHeader('Authorization', testUserAuth.vault_access_token)
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, { client_tasks: doneTasksResult });
}

const itemResponse = {
  associations_to: [],
  associations: [],
  attachments: [],
  classification_nodes: [],
  item: {
    id: itemId,
    own: true,
    name: 'best_pet_label',
    label: 'Best Pet Label',
    description: null,
    created_at: '2020-09-18T06:20:57.013Z',
    item_template_id: 'c098c820-9eae-4f5a-a2ae-fb940a50ab2a',
    ordinal: 1,
    visible: true,
    updated_at: '2020-09-18T06:21:31.342Z',
    item_template_label: 'Pet',
    image: 'http://localhost:3000/images/077af9f4-daf8-493f-a9d0-3f3d7fba9764',
    item_image: 'http://localhost:3000/images/077af9f4-daf8-493f-a9d0-3f3d7fba9764',
    item_image_background_colour: null,
    classification_node_ids: [
      '4c07a1db-5a48-4a69-8928-b846c8ee1e43',
      'b2a01ce5-1194-4e61-b575-6af8df576000',
    ],
    association_ids: [],
    associations_to_ids: [],
    slot_ids: ['d886ad1c-176c-4b59-8bd2-ade28f4c118c'],
    me: false,
    background_color: null,
    original_id: null,
    owner_id: 'fac5400c-678c-4b30-b31e-9c4cdbe3741d',
    share_id: shareId,
  },
  slots: [
    {
      id: 'd886ad1c-176c-4b59-8bd2-ade28f4c118c',
      own: true,
      share_id: null,
      name: 'date_of_birth',
      description: null,
      encrypted: true,
      ordinal: 1,
      visible: true,
      classification_node_ids: [],
      attachment_id: null,
      slotable_id: 'feddddcf-1074-4344-b05e-c3907c0304b0',
      slotable_type: 'Item',
      required: false,
      updated_at: '2020-09-18T06:21:31.050Z',
      created_at: '2020-09-18T06:20:57.309Z',
      slot_type_name: SlotType.Date,
      creator: 'system',
      encrypted_value:
        'Aes256Gcm.cKvPRS4w3ZXDMA==.QUAAAAAFaXYADAAAAAC5nXF2re7hCuoKRuYFYXQAEAAAAAAEqqhXgXWLJPNMQPz-43a1AmFkAAUAAABub25lAAA=',
      encrypted_value_verification_key: null,
      value_verification_hash: null,
      image: null,
      label: 'Date of Birth',
      original_id: null,
      owner_id: 'fac5400c-678c-4b30-b31e-9c4cdbe3741d',
    },
  ],
  thumbnails: [],
};

function getSharedItem() {
  return Promise.resolve({
    associations_to: [],
    associations: [],
    attachments: [],
    classification_nodes: [],
    item: (itemResponse.item as any) as Item,
    slots: ((itemResponse.slots as any) as Slot[]).map(x => ({ ...x, value: '1234' })),
    thumbnails: [],
  });
}
