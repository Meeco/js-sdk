import {
  CreateDidDto,
  DIDCreateResultDto,
  DIDManagementApi,
} from '@meeco/identity-network-api-sdk';
import { NewDID } from '../../models/did-management/new-did';
import { AbstractActionHandler, SupportedDIDAction, SupportedDIDState } from './did-action-handler';

export class SigningRequestActionHandler extends AbstractActionHandler {
  constructor(public newDID: NewDID) {
    super();
    this.newDID = newDID;
  }
  action: SupportedDIDAction = SupportedDIDAction.signPayload;
  state: SupportedDIDState = SupportedDIDState.action;

  async handleRequest(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto> {
    const msg = Buffer.from(
      didCreateResultDto.didState!.signingRequest!.signingRequestAttrib!.serializedPayload!,
      'base64'
    );

    const didDto: CreateDidDto = {
      jobId: didCreateResultDto.jobId,
      options: {
        clientSecretMode: true,
      },
      secret: {
        signingResponse: {
          signingRequestAttrib: {
            signature: Buffer.from(this.newDID.keyPair.sign(msg)).toString('base64'),
          },
        },
      },
    };

    const result = await api.didControllerCreate(this.newDID.method, didDto);
    return result;
  }
}
