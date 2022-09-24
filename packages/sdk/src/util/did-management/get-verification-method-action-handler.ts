import {
  CreateDidDto,
  DeactivateDidDto,
  DIDCreateResultDto,
  DIDDeactivateResultDto,
  DIDUpdateResultDto,
  UpdateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../../models/did-management/did-base';
import {
  AbstractActionHandler,
  DidDto,
  DIDResultDto,
  SupportedDIDAction,
  SupportedDIDState,
} from './did-action-handler';

export class GetVerificationMethodActionHandler<
  TypeDIDResultDto extends DIDResultDto,
  TypeDidDto extends DidDto
> extends AbstractActionHandler<TypeDIDResultDto, TypeDidDto> {
  constructor(public did: DIDBase) {
    super(did, SupportedDIDAction.getVerificationMethod, SupportedDIDState.action);
  }

  handleRequestResponse(didResultDto: DIDCreateResultDto): CreateDidDto | null;
  handleRequestResponse(didResultDto: DIDUpdateResultDto): UpdateDidDto | null;
  handleRequestResponse(didResultDto: DIDDeactivateResultDto): DeactivateDidDto | null;
  handleRequestResponse(
    didResultDto: TypeDIDResultDto
  ): CreateDidDto | UpdateDidDto | DeactivateDidDto | null {
    this.did.didDocument.verificationMethod = [
      {
        id: didResultDto.didState!.verificationMethodTemplate![0].id,
        type: didResultDto.didState!.verificationMethodTemplate![0].type,
        publicKeyBase58: this.did.keyPair.getPublicKeyBase58(),
      },
    ];

    return {
      options: this.did.options,
      didDocument: this.did.didDocument,
    };
  }
}
