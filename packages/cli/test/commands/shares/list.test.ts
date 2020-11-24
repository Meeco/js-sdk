import { ShareService, ShareType } from '@meeco/sdk';
import { Share } from '@meeco/vault-api-sdk';
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

describe('shares:list', () => {
  const response: Share[] = [
    {
      id: '65b3c3c1-fe2b-48b6-8002-46be46c6d7f7',
      owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
      sender_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
      recipient_id: 'da5b0a98-4ef7-4cb7-889b-f17c77e94adc',
      acceptance_required: 'acceptance_required',
      item_id: '2c9b15f1-7b28-44af-9fe0-70e3ea308c0c',
      slot_id: null,
      public_key: '-----BEGIN PUBLIC KEY-----ABCD',
      sharing_mode: 'anyone',
      keypair_external_id: 'edff1a41-5cc9-45ef-8800-20948c86fd5c',
      encrypted_dek: null,
      terms: null,
      created_at: new Date(1),
      expires_at: null,
    },
    {
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
      created_at: new Date(1),
      expires_at: null,
    },
  ];

  customTest
    .stdout()
    .stderr()
    .stub(
      ShareService.prototype,
      'listShares',
      sinon
        .stub()
        .withArgs({ vault_access_token: '2FPN4n5T68xy78i6HHuQ' }, ShareType.Incoming)
        .returns(response)
    )
    .run(['shares:list', ...testUserAuth, ...testEnvironmentFile, '-t', ShareType.Incoming])
    .it('shows a list of incoming shared items', ctx => {
      const expected = readFileSync(outputFixture('list-incoming-shares.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stdout()
    .stderr()
    .stub(
      ShareService.prototype,
      'listAll',
      sinon
        .stub()
        .withArgs({ vault_access_token: '2FPN4n5T68xy78i6HHuQ' }, ShareType.Incoming)
        .returns(response)
    )
    .run([
      'shares:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-t',
      ShareType.Incoming,
      ...testGetAll,
    ])
    .it('shows a list of shared items when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-incoming-shares.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  const response2: Share[] = [
    {
      id: '65b3c3c1-fe2b-48b6-8002-46be46c6d7f7',
      owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
      sender_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
      recipient_id: 'da5b0a98-4ef7-4cb7-889b-f17c77e94adc',
      acceptance_required: 'acceptance_required',
      item_id: '2c9b15f1-7b28-44af-9fe0-70e3ea308c0c',
      slot_id: null,
      public_key: '-----BEGIN PUBLIC KEY-----ABCD',
      sharing_mode: 'anyone',
      keypair_external_id: 'edff1a41-5cc9-45ef-8800-20948c86fd5c',
      encrypted_dek:
        'Rsa4096.lt5lgL1fof9VNdH6KztwXo0lsamZFfV6zHWQ1QdjkTY85__0l1k9OhGk4fVtankcpusE_T35p9VN-fkP4G2Cr_qrrcHTaD4ESxXMc7ZweRfRjXUBRNOUoQe5O4R03J9I766NXYkB8M5tDuQYo4Agl_dEQl61bVSg_cYjiSz7J5K71zKpHEN5WAK0a2QUN8f01Py3mbr-D8057osMs8JcU72COMRZtIW4M1oEcPyl2VyJ3tJtFnTGZnurR9Zt0aAjWcTg8GyfTJ7ilB8JnuYqo9OY16wbMlgr8D7-HZCmY9Sn76dgamCb_9vDofqTFt7PVrWHydwxzBKc1fiqAxYd39pM9uuibFu718j9KfgzBsG3NqSKfoE-efG1grF64n3uSWeD6YbGGV-5myy84AX40I_Qy7mbSllD372n-kTilMIu0AFw-hVWqt8Nhd0PARep81jYUKSTu9eZgmgWokvyiGgrKWfvatosgjsW_JZ--zBrjRC6b_WFTZpStfFhDCrrE0cZzFAWnoHdTXUbrw8d3ysg7SQEKs8EYkghMlKxM7l5Ojqsh9o2lmmEVIlOSTnv23HYDKn0B94yoNqyGXYWE4SWbF7bDTnDoV9gcz4V14o9Zwj3AI-LfqV3uh68S_JhGO3qR3yl4M5zj6uaPfhYAd6s-8UAhwssMBS3wxEW2oo=.QQUAAAAA',
      terms: null,
      created_at: new Date(1),
      expires_at: null,
    },
    {
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
      created_at: new Date(1),
      expires_at: null,
    },
  ];

  // outgoing shares
  customTest
    .stdout()
    .stderr()
    .stub(
      ShareService.prototype,
      'listShares',
      sinon
        .stub()
        .withArgs({ vault_access_token: '2FPN4n5T68xy78i6HHuQ' }, ShareType.Outgoing)
        .returns(response2)
    )
    .run(['shares:list', ...testUserAuth, ...testEnvironmentFile, '-t', ShareType.Outgoing])
    .it('shows a list of shared items (to and from the user)', ctx => {
      const expected = readFileSync(outputFixture('list-outgoing-shares.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});
