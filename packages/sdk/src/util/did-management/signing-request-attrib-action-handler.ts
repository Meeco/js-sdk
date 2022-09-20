import {
  CreateDidDto,
  DIDCreateResultDto,
  DIDUpdateResultDto,
  UpdateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../../models/did-management/did-base';
import { AbstractActionHandler, SupportedDIDAction, SupportedDIDState } from './did-action-handler';

export class SigningRequestAttribActionHandler extends AbstractActionHandler {
  constructor(public did: DIDBase) {
    super(did, SupportedDIDAction.signPayload, SupportedDIDState.action);
  }

  handleCreateRequestResponse(didCreateResultDto: DIDCreateResultDto): CreateDidDto | null {
    return this.process(didCreateResultDto);
  }

  handleUpdateRequestResponse(didUpdateResultDto: DIDUpdateResultDto): UpdateDidDto | null {
    const result = this.process(didUpdateResultDto);
    return { ...result, did: '', didDocumentOperation: [] };
  }

  private process(didResultDto) {
    // check if signingRequestAttrib serialized payload exists or continue to next handler
    if (!didResultDto.didState?.signingRequest?.signingRequestAttrib?.serializedPayload)
      return null;

    const serializedPayload =
      didResultDto.didState!.signingRequest?.signingRequestAttrib!.serializedPayload;

    const msg = Buffer.from(serializedPayload!, 'base64');

    const didDto = {
      jobId: didResultDto.jobId,
      options: {
        clientSecretMode: this.did.options.clientSecretMode,
      },
      secret: {
        signingResponse: {
          signingRequestAttrib: {
            signature: Buffer.from(this.did.keyPair.sign(msg)).toString('base64'),
          },
        },
      },
    };

    return didDto;
  }
}