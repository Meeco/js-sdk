import { DIDCreateResultDto, DIDManagementApi } from '@meeco/identity-network-api-sdk';

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
  nextHandler!: DIDRequestHandler;

  abstract handleRequest(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto>;

  async processRequestResponse(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto> {
    if (
      didCreateResultDto.didState!.state === this.state &&
      didCreateResultDto.didState!.action === this.action
    ) {
      didCreateResultDto = await this.handleRequest(didCreateResultDto, api);
    }
    if (this.nextHandler) {
      didCreateResultDto = await this.nextHandler.processRequestResponse(didCreateResultDto, api);
    }

    return didCreateResultDto;
  }
  setNextHandler(nextHandler: DIDRequestHandler) {
    this.nextHandler = nextHandler;
  }
}
