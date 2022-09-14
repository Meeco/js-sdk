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

export abstract class NewDID {
  constructor(public method: string, public network: string, public didDocument: DidDocumentDto) {
    this.method = method;
    this.network = network;
    this.didDocument = didDocument;
  }
  abstract keyPair: IKeyPairDID;
  abstract getHandlerChain(): DIDRequestHandler;
}
