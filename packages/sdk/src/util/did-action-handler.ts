import {
  CreateDidDto,
  DIDCreateResultDto,
  DIDManagementApi,
} from '@meeco/identity-network-api-sdk';
import { NewDID } from '../models/new-did';

export enum SupportedDIDAction {
  redirect = 'redirect',
  getVerificationMethod = 'getVerificationMethod',
  signPayload = 'signPayload',
  decryptPayload = 'decryptPayload',
}

export enum SupportedDIDState {
  finished = 'finished',
  failed = 'failed',
  action = 'action',
  wait = 'wait',
}

export interface DIDRequestHandler {
  processRequestResponse(
    request: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto>;
  setNextHandler(handler: DIDRequestHandler): void;
}

export abstract class AbstractActionHandler implements DIDRequestHandler {
  abstract action: SupportedDIDAction;
  abstract state: SupportedDIDState;
  abstract handleRequest(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto>;

  public nextHandler!: DIDRequestHandler;

  public async processRequestResponse(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto> {
    if (
      didCreateResultDto.didState.state == this.state &&
      didCreateResultDto.didState.action == this.action
    ) {
      didCreateResultDto = await this.handleRequest(didCreateResultDto, api);
    }
    if (this.nextHandler) {
      didCreateResultDto = await this.nextHandler.processRequestResponse(didCreateResultDto, api);
    }

    return didCreateResultDto;
  }
  public setNextHandler(nextHandler: DIDRequestHandler) {
    this.nextHandler = nextHandler;
  }
}

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
    // TODO: check if didCreateResultDto - verificationMethodTemplate template type
    // based on that prepare did document verification method
    this.newDID.didDocument.verificationMethod = [
      {
        id: '#key-1',
        type: 'Ed25519VerificationKey2018',
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
    // TODO: check if didCreateResultDto - signingRequest type
    // based on that prepare signingResponse

    var msg = Buffer.from(
      didCreateResultDto.didState.signingRequest.signingRequestAttrib.serializedPayload,
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
