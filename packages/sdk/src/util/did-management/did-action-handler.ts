import {
  CreateDidDto,
  DIDCreateResultDto,
  DIDManagementApi,
  DIDUpdateResultDto,
  UpdateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../../models/did-management/did-base';

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
  processCreateRequestResponse(
    request: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto>;
  setNextHandler(handler: DIDRequestHandler): void;
}

export abstract class AbstractActionHandler<T extends CreateDidDto, U extends UpdateDidDto>
  implements DIDRequestHandler
{
  constructor(
    public did: DIDBase,
    public action: SupportedDIDAction,
    public state: SupportedDIDState
  ) {}

  nextHandler!: DIDRequestHandler;

  abstract handleCreateRequestResponse(didCreateResultDto: DIDCreateResultDto): T | null;
  abstract handleUpdateRequestResponse(didUpdateResultDto: DIDUpdateResultDto): U | null;

  async processCreateRequestResponse(
    didCreateResultDto: DIDCreateResultDto,
    api: DIDManagementApi
  ): Promise<DIDCreateResultDto> {
    if (
      didCreateResultDto.didState!.state === this.state &&
      didCreateResultDto.didState!.action === this.action
    ) {
      const dto = this.handleCreateRequestResponse(didCreateResultDto);
      if (dto) didCreateResultDto = await api.didControllerCreate(this.did.method, dto);
    }
    if (this.nextHandler) {
      didCreateResultDto = await this.nextHandler.processCreateRequestResponse(
        didCreateResultDto,
        api
      );
    }

    return didCreateResultDto;
  }

  async processUpdateRequestResponse(
    didUpdateResultDto: DIDUpdateResultDto,
    api: DIDManagementApi
  ): Promise<DIDUpdateResultDto> {
    if (
      didUpdateResultDto.didState!.state === this.state &&
      didUpdateResultDto.didState!.action === this.action
    ) {
      const dto = this.handleUpdateRequestResponse(didUpdateResultDto);
      if (dto) didUpdateResultDto = await api.didControllerUpdate(this.did.method, dto);
    }
    if (this.nextHandler) {
      didUpdateResultDto = await this.nextHandler.processCreateRequestResponse(
        didUpdateResultDto,
        api
      );
    }

    return didUpdateResultDto;
  }

  setNextHandler(nextHandler: DIDRequestHandler) {
    this.nextHandler = nextHandler;
  }
}
