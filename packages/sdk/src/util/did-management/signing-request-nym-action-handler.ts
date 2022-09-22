import {
  CreateDidDto,
  DeactivateDidDto,
  DIDCreateResultDto,
  DIDDeactivateResultDto,
  DIDUpdateResultDto,
  UpdateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../../models/did-management/did-base';
import { AbstractActionHandler, SupportedDIDAction, SupportedDIDState } from './did-action-handler';

export class SigningRequestNymActionHandler extends AbstractActionHandler {
  constructor(public did: DIDBase) {
    super(did, SupportedDIDAction.signPayload, SupportedDIDState.action);
  }

  handleCreateRequestResponse(didCreateResultDto: DIDCreateResultDto): CreateDidDto | null {
    return this.process(didCreateResultDto);
  }
  handleUpdateRequestResponse(didUpdateResultDto: DIDUpdateResultDto): UpdateDidDto | null {
    const result = this.process(didUpdateResultDto);
    return result ? { ...result, did: this.did.didDocument.id!, didDocumentOperation: [] } : null;
  }

  handleDeactivateRequestResponse(
    didDeactivateResultDto: DIDDeactivateResultDto
  ): DeactivateDidDto | null {
    const result = this.process(didDeactivateResultDto);
    return result ? { ...result, did: this.did.didDocument.id! } : null;
  }

  private process(
    didResultDto: DIDCreateResultDto | DIDUpdateResultDto | DIDDeactivateResultDto
  ): CreateDidDto | UpdateDidDto | DeactivateDidDto | null {
    // check if signingRequestNym serialized payload exists or continue to next handler
    if (!didResultDto.didState?.signingRequest?.signingRequestNym?.serializedPayload) return null;
    const serializedPayload =
      didResultDto.didState!.signingRequest?.signingRequestNym!.serializedPayload;

    const msg = Buffer.from(serializedPayload!, 'base64');

    const didDto = {
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
