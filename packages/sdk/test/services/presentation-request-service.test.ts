import { DecryptedItem } from '@meeco/sdk';
import { PresentationRequestResponseVerificationResultResponseDto } from '@meeco/vc-api-sdk';
import sinon from 'sinon';
import { DecryptedItems, ItemService } from '../../src/services/item-service';
import { PresentationRequestService } from '../../src/services/presentation-request-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('PresentationRequestService', () => {
  let presentationRequestService: PresentationRequestService;

  beforeEach(() => {
    presentationRequestService = new PresentationRequestService(environment);
  });
  describe('#getPresentationRequestResponseItem', () => {
    customTest
      .stub(
        ItemService.prototype,
        'get',
        sinon.stub().returns(Promise.resolve({} as DecryptedItem))
      )
      .it('should return the presentation response item by responseId', async () => {
        const mockResponseId = 'mockResponseId';
        await presentationRequestService.getPresentationRequestResponseItem(
          {
            vault_access_token: testUserAuth.vault_access_token,
            keystore_access_token: testUserAuth.keystore_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
            key_encryption_key: testUserAuth.data_encryption_key,
          },
          mockResponseId
        );
        const itemServiceAuth = {
          vault_access_token: testUserAuth.vault_access_token,
          keystore_access_token: testUserAuth.keystore_access_token,
          data_encryption_key: testUserAuth.data_encryption_key,
          key_encryption_key: testUserAuth.data_encryption_key,
        };
        sinon.assert.calledWith(
          ItemService.prototype.get as sinon.SinonStub,
          itemServiceAuth,
          mockResponseId
        );
      });
  });
  describe('#getPresentationRequestResponseItems', () => {
    customTest
      .stub(
        ItemService.prototype,
        'listDecrypted',
        sinon.stub().returns(Promise.resolve({} as DecryptedItems))
      )
      .it('should return the presentation response items by credentialRequestId', async () => {
        const mockRequestId = 'mockRequestId';
        await presentationRequestService.getPresentationRequestResponseItems(
          {
            vault_access_token: testUserAuth.vault_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
          },
          mockRequestId
        );
        const itemServiceAuth = {
          vault_access_token: testUserAuth.vault_access_token,
          data_encryption_key: testUserAuth.data_encryption_key,
        };
        sinon.assert.calledWith(
          ItemService.prototype.listDecrypted as sinon.SinonStub,
          itemServiceAuth,
          { name: mockRequestId }
        );
      });
  });
  describe('#deletePresentationRequestResponseItem', () => {
    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .delete('/items/reponse_id')
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(204)
      )
      .it('should delete the presentation response item by credentialRequestId', async () => {
        await new PresentationRequestService(environment).deletePresentationRequestResponseItem(
          testUserAuth,
          'reponse_id'
        );
      });
  });

  describe('createPresentationRequestResponseItem', () => {
    customTest
      .stub(
        ItemService.prototype,
        'create',
        sinon.stub().returns(Promise.resolve({} as DecryptedItem))
      )
      .it('should create a presentation request response item', async () => {
        await presentationRequestService.createPresentationRequestResponseItem(
          {
            vault_access_token: testUserAuth.vault_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
          },
          {
            presentationRequestId: 'presentationRequestId',
            idToken: 'idToken',
            vpToken: 'vpToken',
            presentationSubmission: 'presentationSubmission',
            state: 'state',
            verificationResult: {} as PresentationRequestResponseVerificationResultResponseDto,
          }
        );

        const itemServiceAuth = {
          vault_access_token: testUserAuth.vault_access_token,
          data_encryption_key: testUserAuth.passphrase_derived_key,
        };

        const expectedItem = {
          slots: [
            {
              slot_type_name: 'key_value',
              label: 'ID Token',
              name: 'id_token',
              value: 'idToken',
            },
            {
              slot_type_name: 'key_value',
              label: 'VP Token',
              name: 'vp_token',
              value: 'vpToken',
            },
            {
              slot_type_name: 'key_value',
              label: 'Presentation Submission',
              name: 'presentation_submission',
              value: 'presentationSubmission',
            },
            {
              slot_type_name: 'key_value',
              label: 'State',
              name: 'state',
              value: 'state',
            },
            {
              slot_type_name: 'key_value',
              label: 'Verification result',
              name: 'verification_result',
              value: JSON.stringify({}),
            },
            {
              slot_type_name: 'key_value',
              label: 'Presentation request id',
              name: 'presentation_request_id',
              value: 'presentationRequestId',
            },
            {
              slot_type_name: 'datetime',
              label: 'Last verified at',
              name: 'last_verified_at',
              value: new Date().toJSON(),
            },
          ],
          classification_nodes: [],
          label: 'Presentation request (id: presentationRequestId) response',
          template_name: 'presentation_request_response',
          name: 'presentationRequestId',
        };
        sinon.assert.calledWith(
          ItemService.prototype.create as sinon.SinonStub,
          sinon.match({
            vault_access_token: itemServiceAuth.vault_access_token,
            data_encryption_key: sinon.match.object,
          }),
          sinon.match(expectedItem)
        );
      });
  });
});
