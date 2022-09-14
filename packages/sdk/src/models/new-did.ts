import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { ec, eddsa } from 'elliptic';
import {
  DIDRequestHandler,
  GetVerificationMethodActionHandler,
  SigningRequestActionHandler,
} from '../util/did-action-handler';
const b58 = require('bs58');

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

export interface IKeyPairDID {
  keyPair: eddsa.KeyPair | ec.KeyPair;
  sign(message: Uint8Array): Uint8Array;
  getPublicKeyBase58(): string;
  getPublicKeyHex(): string;
}

export class Ed25519 implements IKeyPairDID {
  keyPair: eddsa.KeyPair;
  constructor(secret: Uint8Array) {
    const ed25519 = new eddsa('ed25519');
    this.keyPair = ed25519.keyFromSecret(Buffer.from(secret));
  }
  sign(message: Uint8Array): Uint8Array {
    return this.keyPair.sign(Buffer.from(message)).toBytes();
  }
  getPublicKeyBase58(): string {
    return b58.encode(this.keyPair.getPublic());
  }
  getPublicKeyHex(): string {
    return this.keyPair.getPublic('hex');
  }
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

export class SOV extends NewDID {
  constructor(
    public didDocument: DidDocumentDto,
    public keyPair: IKeyPairDID,
    public network: SupportedNetwork = SupportedNetwork.DANUBE
  ) {
    super(SupportedDidMethod.SOV, network, didDocument);
  }
  getHandlerChain(): DIDRequestHandler {
    const verificationMethod = new GetVerificationMethodActionHandler(this);
    const signingRequestAttrib = new SigningRequestActionHandler(this);

    verificationMethod.setNextHandler(signingRequestAttrib);

    return verificationMethod;
  }
}
