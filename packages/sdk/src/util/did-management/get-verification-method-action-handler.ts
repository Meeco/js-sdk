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

  verificationMethodType = new Map<string, object>([
    [
      'JsonWebKey2020',
      {
        publicKeyJwk: {
          kty: 'OKP',
          crv: this.did.keyPair.getName(),
          x: this.did.keyPair.getPublicKeyBase64URL(),
        },
      },
    ],
    ['Ed25519VerificationKey2018', { publicKeyBase58: this.did.keyPair.getPublicKeyBase58() }],
  ]);

  handleRequestResponse(didResultDto: DIDCreateResultDto): CreateDidDto | null;
  handleRequestResponse(didResultDto: DIDUpdateResultDto): UpdateDidDto | null;
  handleRequestResponse(didResultDto: DIDDeactivateResultDto): DeactivateDidDto | null;
  handleRequestResponse(
    didResultDto: TypeDIDResultDto
  ): CreateDidDto | UpdateDidDto | DeactivateDidDto | null {
    const type = didResultDto.didState!.verificationMethodTemplate![0].type;

    this.did.didDocument.verificationMethod = [
      {
        id: didResultDto.didState!.verificationMethodTemplate![0].id,
        type,
        ...this.verificationMethodType.get(type!),
      },
    ];

    return {
      options: this.did.options,
      didDocument: this.did.didDocument,
    };
  }
}
