import {
  CreateDidDto,
  DIDCreateResultDto,
  DIDUpdateResultDto,
  UpdateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../../models/did-management/did-base';
import { AbstractActionHandler, SupportedDIDAction, SupportedDIDState } from './did-action-handler';

export class GetVerificationMethodActionHandler extends AbstractActionHandler<
  CreateDidDto,
  UpdateDidDto
> {
  constructor(public did: DIDBase) {
    super(did, SupportedDIDAction.getVerificationMethod, SupportedDIDState.action);
  }

  handleCreateRequestResponse(didCreateResultDto: DIDCreateResultDto): CreateDidDto {
    this.did.didDocument.verificationMethod = [
      {
        id: didCreateResultDto.didState!.verificationMethodTemplate![0].id,
        type: didCreateResultDto.didState!.verificationMethodTemplate![0].type,
        publicKeyBase58: this.did.keyPair.getPublicKeyBase58(),
      },
    ];

    return {
      options: this.did.options,
      didDocument: this.did.didDocument,
    };
  }

  handleUpdateRequestResponse(didUpdateResultDto: DIDUpdateResultDto): UpdateDidDto | null {
    return null;
  }
}
