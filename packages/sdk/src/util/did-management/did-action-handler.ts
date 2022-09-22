import {
  CreateDidDto,
  DeactivateDidDto,
  DIDCreateResultDto,
  DIDDeactivateResultDto,
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
    didCreateResultDto: DIDCreateResultDto,
    sendRequest: (method: string, dto: CreateDidDto) => Promise<DIDCreateResultDto>
  ): Promise<DIDCreateResultDto>;

  processUpdateRequestResponse(
    didUpdateResultDto: DIDUpdateResultDto,
    sendRequest: (method: string, dto: UpdateDidDto) => Promise<DIDUpdateResultDto>
  ): Promise<DIDUpdateResultDto>;

  processDeactivateRequestResponse(
    didDeleteResultDto: DIDDeactivateResultDto,
    sendRequest: (method: string, dto: DeactivateDidDto) => Promise<DIDDeactivateResultDto>
  ): Promise<DIDDeactivateResultDto>;

  setNextHandler(handler: DIDRequestHandler): void;
}

export abstract class AbstractActionHandler implements DIDRequestHandler {
  constructor(
    public did: DIDBase,
    public action: SupportedDIDAction,
    public state: SupportedDIDState
  ) {}

  nextHandler!: DIDRequestHandler;

  abstract handleCreateRequestResponse(didCreateResultDto: DIDCreateResultDto): CreateDidDto | null;
  abstract handleUpdateRequestResponse(didUpdateResultDto: DIDUpdateResultDto): UpdateDidDto | null;
  abstract handleDeactivateRequestResponse(
    didDeactivateResultDto: DIDDeactivateResultDto
  ): DeactivateDidDto | null;

  async processCreateRequestResponse(
    didCreateResultDto: DIDCreateResultDto,
    sendRequest: (method: string, dto: CreateDidDto) => Promise<DIDCreateResultDto>
  ): Promise<DIDCreateResultDto> {
    if (
      didCreateResultDto.didState!.state === this.state &&
      didCreateResultDto.didState!.action === this.action
    ) {
      const dto = this.handleCreateRequestResponse(didCreateResultDto);
      if (dto) didCreateResultDto = await sendRequest(this.did.method, dto);
    }
    if (this.nextHandler) {
      didCreateResultDto = await this.nextHandler.processCreateRequestResponse(
        didCreateResultDto,
        sendRequest
      );
    }

    return didCreateResultDto;
  }

  async processUpdateRequestResponse(
    didUpdateResultDto: DIDUpdateResultDto,
    sendRequest: (method: string, dto: UpdateDidDto) => Promise<DIDUpdateResultDto>
  ): Promise<DIDUpdateResultDto> {
    if (
      didUpdateResultDto.didState!.state === this.state &&
      didUpdateResultDto.didState!.action === this.action
    ) {
      const dto = this.handleUpdateRequestResponse(didUpdateResultDto);
      if (dto) didUpdateResultDto = await sendRequest(this.did.method, dto);
    }
    if (this.nextHandler) {
      didUpdateResultDto = await this.nextHandler.processUpdateRequestResponse(
        didUpdateResultDto,
        sendRequest
      );
    }

    return didUpdateResultDto;
  }

  async processDeactivateRequestResponse(
    didDeactivateResultDto: DIDDeactivateResultDto,
    sendRequest: (method: string, dto: DeactivateDidDto) => Promise<DIDDeactivateResultDto>
  ): Promise<DIDDeactivateResultDto> {
    if (
      didDeactivateResultDto.didState!.state === this.state &&
      didDeactivateResultDto.didState!.action === this.action
    ) {
      const dto = this.handleDeactivateRequestResponse(didDeactivateResultDto);
      if (dto) didDeactivateResultDto = await sendRequest(this.did.method, dto);
    }
    if (this.nextHandler) {
      didDeactivateResultDto = await this.nextHandler.processDeactivateRequestResponse(
        didDeactivateResultDto,
        sendRequest
      );
    }

    return didDeactivateResultDto;
  }

  setNextHandler(nextHandler: DIDRequestHandler) {
    this.nextHandler = nextHandler;
  }
}
