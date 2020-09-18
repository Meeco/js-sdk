import { expect } from '@oclif/test';
import { ClientTaskQueueService } from '../../src/services/client-task-queue-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('Client-task-queue list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get(`/items/${itemId}`)
        .matchHeader('Authorization', testUserAuth.vault_access_token)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, itemResponse)
    )
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get(`/items/${itemId}/shares`)
        .matchHeader('Authorization', testUserAuth.vault_access_token)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, sharesResponse)
    )
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .put(`/items/${itemId}/shares`)
        .matchHeader('Authorization', testUserAuth.vault_access_token)
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, itemSharesUpdateResponse)
    )
    .mockCryppo()
    .it('list task that client suppose to perform', async () => {
      const result = await new ClientTaskQueueService(environment).executeClientTasks(
        listOfClientTasks,
        testUserAuth
      );

      expect(result.completedTasks.length).to.equal(1);
      expect(result.failedTasks.length).to.equal(0);
    });
});

const itemId = 'share_item_id_a';
const listOfClientTasks = [
  {
    id: 'a',
    state: 'todo',
    work_type: 'update_item_shares',
    target_id: itemId,
    additional_options: {},
    last_state_transition_at: new Date(0),
    report: {},
    created_at: new Date(0),
  },
];
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
    slot_ids: [
      'd886ad1c-176c-4b59-8bd2-ade28f4c118c',
      'aaa8abac-a35d-4c7e-b05b-c394b4905c38',
      '6d53bac8-b26e-465b-b6e4-01ab56044475',
      'c1a4e86f-7248-4afe-8587-fdcdb756e42c',
      'f17f757e-10b3-4fdf-bd2d-490719c8508f',
      '2b471862-7809-48cb-84b7-95a4151704c0',
    ],
    me: false,
    background_color: null,
    original_id: null,
    owner_id: 'fac5400c-678c-4b30-b31e-9c4cdbe3741d',
    share_id: null,
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
const sharesResponse = {
  shares: [
    {
      id: '4bef928a-c9e3-4c56-be0d-c5b003169ce0',
      public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA8J9w9UyFZvG3h3EpGoTE\r\nP6QiWhq26JnHJsdoJXfJWXgF1dRawtFI9NdwSaXp9g6/cQE+CN+6PvNU/Asqu4Fn\r\nu3hAdewXvzV6CQm7pl7klvOQZ5pmOlViX7YCCrwBPZJVmMqIV9sh6Lanw65N+16R\r\nG7r5ebzDBhtymVU/gsa2NWeaucCExreOWn9bcMhfihAmYiWDR5IookDp3EcxN5BY\r\nJYIwQ34yUj25zXmJRuCYdfsgnLh1gJHfzfjs6oAIy/Bf/BY8odKAFFsjOnAnhUl3\r\nFL9L/B1F+YL4gdhoZsHdAgUMzShLKjyab8CjTzp2LRNSt/rDFU87RrTSCDTMXS2E\r\nwhMJ3/zjQkSYImRMvxlF/+kkHnea6gGOgE1QyvePpVYn5hXtAoxU9+7RRUu9uVz2\r\n5t5N6Hd00ORJo8u47ZHv7X7rLnHS4mZXsx/wM4dfoHrs3Htjr42r6Y+BH8RZ2+4u\r\n92qagF8xsKXlvExUtjIPXJExxKIeL4QW77SwLQ2KBJfYuu+tL0KLSZOdxbI9p84I\r\nA9H/jWSHVuNXY41NGmPv2EisgZel9WObH3xa6ent28uu1VSflA13CA2JYZFcv/9H\r\nQf3QRjCp02dEnayNB9ro5W2yLLXr4TLG+NVh106w3kYwek02ktW9XpVuxBreWeqs\r\nwNaV/jFKXKF4vXyKcvbmWtcCAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
    },
  ],
};
const itemSharesUpdateResponse = {
  shares: [
    {
      id: '58cd5f91-443b-4964-8f33-1a331c592c7f',
      owner_id: 'e262296c-3e98-4808-b255-96827911d111',
      sender_id: 'e262296c-3e98-4808-b255-96827911d111',
      recipient_id: 'f1d64893-a2a1-46a7-a1ac-71a61f440bc8',
      acceptance_required: 'acceptance_not_required',
      item_id: '768ac126-5dc7-440a-a9ef-09ca1eb3f00e',
      slot_id: null,
      public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAn6Sx7hQgtOCjhTzECd0r\r\ngsgGW2sGKLbHlTbGK2drwnXDge8wLUtfW263Ri3uHwULpYtO+f7IuUjSZHdMen4W\r\nvRUdrnJBqII3dqSIR66Z1E8X9jrtOquRLJT79EVRo0Li4c5sNlOd8PjlAzG2VSF/\r\ngFHFixXWP8gefv9Zu3H3/PWF643EmNVR+f7VpvYxWe/EldLzHUISCWEuwN5/aZaW\r\nfxyw9UGw6493Xvimjxc2wLwLJUCfywVKnR82noWo7IoPyfjXXvjjCtFfjGuuGAXy\r\nR4gDxqxZO6jZb2gnw4NQl3aCpVbOOHNFKPVAt2F1savR0g/VHeJ6B7uWvOkhlwBa\r\nzrhjW+oFrMcFUfnBoB4SM4L6IDUjxkhpJA/g/rgq9KADw78NzSM28kS9qGJHT1bq\r\nOz6ur0W3reK5LY6AmRwxj01qbf6vOt5ohEM3TCcfTBKjPCk6pT/1vQqy+lmC1aUu\r\n2zZw4LTmt6R4nlze2o4ZoNN+CBT6rdaSUE2MVXePkVLsIaECeeJ7SOg/oekv6co+\r\n48FN23Gx2qBK4i1Nf4rsqxAwZFfPazXlyePAAUoTBniJTw53YSwNS2mim4TIzUZf\r\nTd2WWf8VElrnl9JMBQU7Gk0k+YT/GmgcQa2g3qA2U7Pzp+0SRppQDgUNB+jVtJOK\r\nSvCYbTu37hkgWXITnjVbfskCAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
      sharing_mode: 'owner',
      keypair_external_id: 'af9671f6-0f9b-44de-b025-9cfdf0df4666',
      encrypted_dek:
        'Rsa4096.Fp2x-dcqXWCFacYd8f2UI-GEzKDVyAGIA7QhQ3V25Vo5diH9Clk30H0dMFo9RCpUx5SgF4UR4v5r-bS6yzZIXZLhXZYXn400Apfpjqkz8KVyPxIe4TovMiT_J5NPZlQrT01Nz0XXz_XyA2Rermiti_NmDSssHxRep24g_I8cADSRYSHFfclmrHAFRbzBFhJY-mehWqNxkkVjdVBb-sbifdr2bfYFlq-rTxQaXvkmlGNz5qRIt8EWkUYLWJQ2On9vu3VOztsAKlRxjYv-OdkatD0lDqR1gN3SKorLOIddBKqdhhiaUVWuvhiwGcHFoiYAlpl_LmYlBWtnVWAD809A9euGWYbATao0tXUmiqZopCovaiVlrczCCmhClrJShyr-M-4b1fY1VXEOLdoBqwshGI0i87sZvB06udbYUkmuuACuEwXM7ZZ_r_XkuSRRiB3A1qGy1OgoRLLtjktbvOnIMWsUMyTchErP1ZQEcuovlsy6xw6VC0HI7ZlzYuuijE0tP2Qr7hTMxbmk4rdIjJ2r_TWnMasczseseNCkqMyNq5o2Ssvl0_e8_uzmH2LJ7k0ATlbQZgO6L-vVjuHmRumeOV8Y5nIRCIGOZL47KkUOkgSoHssSW9WrNTW2nBlAxXeep0II3H_-Xg0x4lOFXJF2mqBv0o6DqOQEpdbCxAH0mS8=.QQUAAAAA',
      terms: null,
      created_at: '2020-09-18T07:55:11.441Z',
      expires_at: null,
    },
  ],
};
