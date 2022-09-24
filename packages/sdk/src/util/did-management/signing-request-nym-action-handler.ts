import {
  DIDCreateResultDto,
  CreateDidDto,
  DIDUpdateResultDto,
  UpdateDidDto,
  DIDDeactivateResultDto,
  DeactivateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../../models/did-management/did-base';
import {
  AbstractActionHandler,
  DidDto,
  DIDResultDto,
  SupportedDIDAction,
  SupportedDIDState,
} from './did-action-handler';

export class SigningRequestNymActionHandler<
  TypeDIDResultDto extends DIDResultDto,
  TypeDidDto extends DidDto
> extends AbstractActionHandler<TypeDIDResultDto, TypeDidDto> {
  constructor(public did: DIDBase) {
    super(did, SupportedDIDAction.signPayload, SupportedDIDState.action);
  }

  handleRequestResponse(didResultDto: DIDCreateResultDto): CreateDidDto | null;
  handleRequestResponse(didResultDto: DIDUpdateResultDto): UpdateDidDto | null;
  handleRequestResponse(didResultDto: DIDDeactivateResultDto): DeactivateDidDto | null;
  handleRequestResponse(
    didResultDto: TypeDIDResultDto
  ): CreateDidDto | UpdateDidDto | DeactivateDidDto | null {
    // check if signingRequestNym serialized payload exists or continue to next handler
    if (!didResultDto.didState?.signingRequest?.signingRequestNym?.serializedPayload) return null;
    const serializedPayload =
      didResultDto.didState!.signingRequest?.signingRequestNym!.serializedPayload;

    const msg = Buffer.from(serializedPayload!, 'base64');

    const didDto = {
      did: this.did.didDocument?.id ?? undefined,
      didDocumentOperation: [],
      jobId: didResultDto.jobId,
      options: {
        clientSecretMode: this.did.options.clientSecretMode,
      },
      secret: {
        signingResponse: {
          signingRequestNym: {
            signature: Buffer.from(this.did.keyPair.sign(msg)).toString('base64'),
          },
        },
      },
    };

    return didDto;
  }
}
