import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { DIDRequestHandler } from '../../util/did-management/did-action-handler';
import { IKeyPairDID } from './key-pair-did';

export enum SupportedDidMethod {
  SOV = 'sov',
  KEY = 'key',
  WEB = 'web',
  EBSI = 'ebsi',
}

export enum SupportedNetwork {
  DANUBE = 'danube',
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
}

export abstract class DIDBase {
  constructor(
    public method: string,
    public didDocument: DidDocumentDto,
    public options: OptionsDto,
    public did?: string
  ) {
    this.method = method;
    this.options = options;
    this.didDocument = didDocument;
    this.did = did;
  }
  abstract keyPair: IKeyPairDID;
  abstract getCreateHandlerChain(): DIDRequestHandler | undefined;
  abstract getUpdateHandlerChain(): DIDRequestHandler | undefined;
}