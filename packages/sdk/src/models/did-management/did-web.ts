import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { DidDto, DIDRequestHandler, DIDResultDto } from '../../util/did-management';
import { DIDBase, SupportedDidMethod } from './did-base';
import { IKeyPairDID } from './key-pair-did';

export class DIDWeb extends DIDBase {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: OptionsDto = {
      clientSecretMode: false,
      network: undefined,
    }
  ) {
    super(SupportedDidMethod.WEB, didDocument, options);
  }

  setVerificationMethod(domain: string = 'did-web-meeco.me') {
    const id = `did:web:${domain}:${this.keyPair.getPublicKeyBase58()}#key-1`;
    const verificationMethod = {
      id,
      type: 'Ed25519VerificationKey2018',
      publicKeyBase58: this.keyPair.getPublicKeyBase58(),
    };

    this.didDocument.verificationMethod
      ? this.didDocument.verificationMethod.push(verificationMethod)
      : (this.didDocument.verificationMethod = [verificationMethod]);
    return id;
  }

  setAuthentication(id: string) {
    this.didDocument.authentication
      ? // tslint:disable-next-line
        this.didDocument.authentication.push(new String(id))
      : // tslint:disable-next-line
        (this.didDocument.authentication = [new String(id)]);
    return this;
  }

  setAssertionMethod(id: string) {
    this.didDocument.assertionMethod
      ? // tslint:disable-next-line
        this.didDocument.assertionMethod.push(new String(id))
      : // tslint:disable-next-line
        (this.didDocument.assertionMethod = [new String(id)]);

    return this;
  }

  getHandlerChain<TypeDIDResultDto extends DIDResultDto, TypeDidDto extends DidDto>():
    | DIDRequestHandler<TypeDIDResultDto, TypeDidDto>
    | undefined {
    return undefined;
  }
}
