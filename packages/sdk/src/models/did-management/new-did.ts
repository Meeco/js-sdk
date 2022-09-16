import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
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

export type SupportedOptions = {
  clientSecretMode?: boolean;
  network?: string;
};

export abstract class NewDID {
  constructor(
    public method: string,
    public didDocument: DidDocumentDto,
    public options: SupportedOptions
  ) {
    this.method = method;
    this.options = options;
    this.didDocument = didDocument;
  }
  abstract keyPair: IKeyPairDID;
  abstract getHandlerChain(): DIDRequestHandler | undefined;
}
