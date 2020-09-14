import { ShareService } from '@meeco/sdk/src';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import * as nock from 'nock';
import sinon from 'sinon';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('shares:get-incoming', () => {
  const value_verification_hash =
    '91ab18573ee6dd109f89d819244ce98e654c3c0682ca1f54bb550efc4d6b3c2c';

  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .stub(
      ShareService,
      'generate_value_verificaiton_hash',
      sinon.stub().returns(value_verification_hash)
    )
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .nock('https://sandbox.meeco.me/keystore', mockKeystore)
    .run([
      'shares:get-incoming',
      ...testUserAuth,
      ...testEnvironmentFile,
      '9ff995b7-660a-433a-9c84-809eda70db7f',
    ])
    .it('lists item and the decrypted slots from a shared item', ctx => {
      const expected = readFileSync(outputFixture('get-shares.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function mockVault(api: nock.Scope) {
  api
    .get('/incoming_shares/9ff995b7-660a-433a-9c84-809eda70db7f/item')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, sharedItemResponse);
}

function mockKeystore(api: nock.Scope) {
  api
    .get('/keypairs/edff1a41-5cc9-45ef-8800-20948c86fd5c')
    .matchHeader('Authorization', 'a2V5c3RvcmVfYXV0aF90b2tlbg==')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      keypair: {
        encrypted_serialized_key:
          'Rsa4096.lt5lgL1fof9VNdH6KztwXo0lsamZFfV6zHWQ1QdjkTY85__0l1k9OhGk4fVtankcpusE_T35p9VN-fkP4G2Cr_qrrcHTaD4ESxXMc7ZweRfRjXUBRNOUoQe5O4R03J9I766NXYkB8M5tDuQYo4Agl_dEQl61bVSg_cYjiSz7J5K71zKpHEN5WAK0a2QUN8f01Py3mbr-D8057osMs8JcU72COMRZtIW4M1oEcPyl2VyJ3tJtFnTGZnurR9Zt0aAjWcTg8GyfTJ7ilB8JnuYqo9OY16wbMlgr8D7-HZCmY9Sn76dgamCb_9vDofqTFt7PVrWHydwxzBKc1fiqAxYd39pM9uuibFu718j9KfgzBsG3NqSKfoE-efG1grF64n3uSWeD6YbGGV-5myy84AX40I_Qy7mbSllD372n-kTilMIu0AFw-hVWqt8Nhd0PARep81jYUKSTu9eZgmgWokvyiGgrKWfvatosgjsW_JZ--zBrjRC6b_WFTZpStfFhDCrrE0cZzFAWnoHdTXUbrw8d3ysg7SQEKs8EYkghMlKxM7l5Ojqsh9o2lmmEVIlOSTnv23HYDKn0B94yoNqyGXYWE4SWbF7bDTnDoV9gcz4V14o9Zwj3AI-LfqV3uh68S_JhGO3qR3yl4M5zj6uaPfhYAd6s-8UAhwssMBS3wxEW2oo=.QQUAAAAA',
      },
    });
}

const sharedItemResponse = {
  share: {
    id: '9ff995b7-660a-433a-9c84-809eda70db7f',
    owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
    sender_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
    recipient_id: 'da5b0a98-4ef7-4cb7-889b-f17c77e94adc',
    acceptance_required: 'acceptance_not_required',
    item_id: '325f5e77-c670-4ecf-a4d9-84bcc6c9e46e',
    slot_id: null,
    public_key: '-----BEGIN PUBLIC KEY-----ABCD',
    sharing_mode: 'owner',
    keypair_external_id: 'edff1a41-5cc9-45ef-8800-20948c86fd5c',
    encrypted_dek:
      'Rsa4096.omdqu-um6RWbqcCOBwk6-9FVY1tAlkjCD1tU7i1l94vLksE2K4PsuFqbM5QLJdHj7mShKywCCC18LW7ShTj7wXI9L9dRcqVhSZCd4fAS_BK-r0Mi9MeS6284zPjW26KIetu28pIdfUZOLhmiWmSq_xUvbx7wqAahFrHuHfjfl7UKd1lnaWabMQe7GbL0giJWhFliHtTOF2h74nqWnHwYT-sqJLyECacUb3N5p6ySKzv0Vjqf7CWu-lW6rsL0c2_VoRQTBZSBNyWx98Ig3dQHGVYgs1c__94M4w5TLY0QrCZWUcrqlwik7QpJQhCPioQGM32xRMxBi584TfqPQ_KmImAr7H9Rh-EW39fhH_7cqnYpvvZYNl1FYrF4GIvb_EVmqjIILpFLuhtmXuu8NLXUAy2-BpgJteqOLM0sqnMoeayuQQxO1OZJ38GYcHTTUPCoEnRfkTsQMJOuZq7PjC_PpWP1MsG3WfY4haBHvhqN0CcPS-TpcDPqcDwAxaEADHOTvl6WdorTLjO6mV2WLQfrQfMbFQ4Kkrt_YB-gm-_PCw-04o27amg59Tzu3HnPijb27GnfV3yMv_jGiY-_wK98evxNHDbvApk97LQXvLVmyO-_DLlkSnBvByLlf2CZwFOWvxqUTRchlRtjLDX7Cw7GQqBnuzEplP5LZ9QhnLAUQfU=.QQUAAAAA',
    terms: null,
    created_at: new Date(0),
    expires_at: null,
  },
  associations_to: [],
  associations: [],
  attachments: [],
  classification_nodes: [],
  item: {
    id: 'c699d58c-428a-42b4-926e-a73645987eb6',
    own: false,
    name: 'bingo',
    label: 'Bingo',
    description: null,
    created_at: new Date(0),
    item_template_id: '3477147f-9764-4ef1-b96a-4042cf126bf7',
    ordinal: 0,
    visible: true,
    updated_at: new Date(0),
    item_template_label: 'Pet',
    image: 'http://localhost:3000/images/6b2148dd-ac68-4f3b-b91b-f02b23c2f448',
    item_image: 'http://localhost:3000/images/6b2148dd-ac68-4f3b-b91b-f02b23c2f448',
    item_image_background_colour: null,
    classification_node_ids: [
      '9e8d522c-a0ad-4e53-a8e5-e284fe4619e9',
      '08207f0d-d2d8-46fd-af5e-a3cbfac79a0d',
    ],
    association_ids: [],
    associations_to_ids: [],
    slot_ids: ['4f2cb52f-e2d5-41a4-b8a2-44e251aef803'],
    me: false,
    background_color: null,
    original_id: '325f5e77-c670-4ecf-a4d9-84bcc6c9e46e',
    owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
    share_id: '9ff995b7-660a-433a-9c84-809eda70db7f',
  },
  slots: [
    {
      id: '4f2cb52f-e2d5-41a4-b8a2-44e251aef803',
      own: false,
      share_id: '9ff995b7-660a-433a-9c84-809eda70db7f',
      name: 'breed_species',
      description: null,
      encrypted: true,
      ordinal: 0,
      visible: true,
      classification_node_ids: [],
      attachment_id: null,
      slotable_id: 'c699d58c-428a-42b4-926e-a73645987eb6',
      slotable_type: 'Item',
      required: false,
      updated_at: new Date(0),
      created_at: new Date(0),
      slot_type_name: 'key_value',
      creator: 'system',
      encrypted_value:
        'Aes256Gcm.1_8t6Av7RQg=.QUAAAAAFaXYADAAAAABl_Fw4p0LWHJ7WQh8FYXQAEAAAAABchj_6fbEYtgI_vzvx6nJGAmFkAAUAAABub25lAAA=',
      encrypted_value_verification_key:
        'Aes256Gcm.9uuPERwk7MiM_UBhhRaqGzFBqyolFfFFZfIzO-NL15jMcECaWL4Dq38ivY63SLA-SW4mX9R_NLvT_VNJUvnZWw==.QUAAAAAFaXYADAAAAAAFLzoUaAT0qJAIOJQFYXQAEAAAAAAyw7kahXvP1eG6HPO-24__AmFkAAUAAABub25lAAA=',
      value_verification_hash: '91ab18573ee6dd109f89d819244ce98e654c3c0682ca1f54bb550efc4d6b3c2c',
      image: null,
      label: 'Breed',
      original_id: '8ef6b111-ac65-4647-ae01-78c96cb3c5ec',
      owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
      value: 'labrador',
    },
  ],
  thumbnails: [],
};
