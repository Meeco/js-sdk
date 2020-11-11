import {
  ClientTask,
  ClientTaskQueueGetStateEnum,
  Item,
  ShareWithItemData,
  Slot,
} from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import * as nock from 'nock';
import { ClientTaskQueueService } from '../../src/services/client-task-queue-service';
import { ShareService } from '../../src/services/share-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('ClientTaskQueueService.executeClientTasks', () => {
  customTest
    .stub(ShareService.prototype, 'getSharedItem', getSharedItem as any)
    .nock('https://sandbox.meeco.me/vault', stubVault)
    .mockCryppo()
    .it('executes and updates ClientTasks', async () => {
      const result = await new ClientTaskQueueService(environment).executeClientTasks(
        listOfClientTasks,
        testUserAuth
      );

      expect(result.completed.length).to.equal(1);
      expect(result.failed.length).to.equal(0);
    });
});

const shareId = 'share_id';
const itemId = 'share_item_id_a';

const listOfClientTasks: ClientTask[] = [
  {
    id: 'a',
    state: 'todo',
    work_type: 'update_item_shares',
    target_id: shareId,
    additional_options: {},
    last_state_transition_at: new Date(1),
    report: {},
    created_at: new Date(1),
  },
];

function stubVault(api: nock.Scope) {
  api
    .post(`/items/${itemId}/encrypt`)
    .matchHeader('Authorization', testUserAuth.vault_access_token)
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, itemResponse);

  api
    .put(`/client_task_queue`, (body: any) =>
      body.client_tasks.every(x => x.state === ClientTaskQueueGetStateEnum.Done)
    )
    .matchHeader('Authorization', testUserAuth.vault_access_token)
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, { client_tasks: listOfClientTasks.map(x => ({ ...x, state: 'done' })) });
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
      slot_type_name: 'date',
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

function getSharedItem(): Promise<ShareWithItemData> {
  return Promise.resolve({
    share: {
      id: shareId,
      public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA8J9w9UyFZvG3h3EpGoTE\r\nP6QiWhq26JnHJsdoJXfJWXgF1dRawtFI9NdwSaXp9g6/cQE+CN+6PvNU/Asqu4Fn\r\nu3hAdewXvzV6CQm7pl7klvOQZ5pmOlViX7YCCrwBPZJVmMqIV9sh6Lanw65N+16R\r\nG7r5ebzDBhtymVU/gsa2NWeaucCExreOWn9bcMhfihAmYiWDR5IookDp3EcxN5BY\r\nJYIwQ34yUj25zXmJRuCYdfsgnLh1gJHfzfjs6oAIy/Bf/BY8odKAFFsjOnAnhUl3\r\nFL9L/B1F+YL4gdhoZsHdAgUMzShLKjyab8CjTzp2LRNSt/rDFU87RrTSCDTMXS2E\r\nwhMJ3/zjQkSYImRMvxlF/+kkHnea6gGOgE1QyvePpVYn5hXtAoxU9+7RRUu9uVz2\r\n5t5N6Hd00ORJo8u47ZHv7X7rLnHS4mZXsx/wM4dfoHrs3Htjr42r6Y+BH8RZ2+4u\r\n92qagF8xsKXlvExUtjIPXJExxKIeL4QW77SwLQ2KBJfYuu+tL0KLSZOdxbI9p84I\r\nA9H/jWSHVuNXY41NGmPv2EisgZel9WObH3xa6ent28uu1VSflA13CA2JYZFcv/9H\r\nQf3QRjCp02dEnayNB9ro5W2yLLXr4TLG+NVh106w3kYwek02ktW9XpVuxBreWeqs\r\nwNaV/jFKXKF4vXyKcvbmWtcCAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
      owner_id: '',
      sender_id: '',
      recipient_id: '',
      acceptance_required: '',
      item_id: itemId,
      sharing_mode: '',
      keypair_external_id: null,
      encrypted_dek: null,
      terms: null,
      created_at: null,
      expires_at: null,
      slot_id: null,
    },
    associations_to: [],
    associations: [],
    attachments: [],
    classification_nodes: [],
    item: (itemResponse.item as any) as Item,
    slots: ((itemResponse.slots as any) as Slot[]).map(x => ({ ...x, value: '1234' })),
    thumbnails: [],
  });
}
