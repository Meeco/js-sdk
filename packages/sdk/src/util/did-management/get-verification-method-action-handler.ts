import { DIDCreateResultDto, DIDManagementApi } from '@meeco/identity-network-api-sdk';
import { NewDID } from '../../models/did-management/new-did';
import { AbstractActionHandler, SupportedDIDAction, SupportedDIDState } from './did-action-handler';

export class GetVerificationMethodActionHandler extends AbstractActionHandler {
  constructor(public newDID: NewDID) {
    super();
    this.newDID = newDID;
  }

  action: SupportedDIDAction = SupportedDIDAction.getVerificationMethod;
  state: SupportedDIDState = SupportedDIDState.action;

  async handleRequest(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto> {
    this.newDID.didDocument.verificationMethod = [
      {
        id: didCreateResultDto.didState!.verificationMethodTemplate![0].id,
        type: didCreateResultDto.didState!.verificationMethodTemplate![0].type,
        publicKeyBase58: this.newDID.keyPair.getPublicKeyBase58(),
      },
    ];

    const didDto = {
      options: {
        clientSecretMode: true,
        network: this.newDID.network,
      },
      didDocument: this.newDID.didDocument,
    };

    const result = await api.didControllerCreate(this.newDID.method, didDto);
    return result;
  }
}
