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

export type DIDResultDto = DIDCreateResultDto | DIDUpdateResultDto | DIDDeactivateResultDto;
export type DidDto = CreateDidDto | UpdateDidDto | DeactivateDidDto;

export interface DIDRequestHandler<TypeDIDResultDto, TypeDidDto> {
  processRequestResponse(
    DIDResultDto: TypeDIDResultDto,
    sendRequest: (method: string, dto: TypeDidDto) => Promise<TypeDIDResultDto>
  ): Promise<TypeDIDResultDto>;

  setNextHandler(handler: DIDRequestHandler<TypeDIDResultDto, TypeDidDto>): void;
}

export abstract class AbstractActionHandler<
  TypeDIDResultDto extends DIDResultDto,
  TypeDidDto extends DidDto
> implements DIDRequestHandler<TypeDIDResultDto, TypeDidDto>
{
  constructor(
    public did: DIDBase,
    public action: SupportedDIDAction,
    public state: SupportedDIDState
  ) {}

  nextHandler!: DIDRequestHandler<TypeDIDResultDto, TypeDidDto>;

  abstract handleRequestResponse(didResultDto: DIDCreateResultDto): CreateDidDto | null;
  abstract handleRequestResponse(didResultDto: DIDUpdateResultDto): UpdateDidDto | null;
  abstract handleRequestResponse(didResultDto: DIDDeactivateResultDto): DeactivateDidDto | null;

  async processRequestResponse(
    didResultDto: TypeDIDResultDto,
    sendRequest: (method: string, dto: TypeDidDto) => Promise<TypeDIDResultDto>
  ): Promise<TypeDIDResultDto> {
    if (
      didResultDto.didState!.state === this.state &&
      didResultDto.didState!.action === this.action
    ) {
      const dto = this.handleRequestResponse(didResultDto);
      if (dto) didResultDto = await sendRequest(this.did.method, dto as any);
    }
    if (this.nextHandler) {
      didResultDto = await this.nextHandler.processRequestResponse(didResultDto, sendRequest);
    }
    return didResultDto;
  }

  setNextHandler(nextHandler: DIDRequestHandler<TypeDIDResultDto, TypeDidDto>) {
    this.nextHandler = nextHandler;
  }
}
