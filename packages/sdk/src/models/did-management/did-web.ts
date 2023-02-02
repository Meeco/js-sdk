import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { v4 as uuidv4 } from 'uuid';
import { DidDto, DIDRequestHandler, DIDResultDto } from '../../util/did-management';
import { DIDBase, SupportedDidMethod } from './did-base';
import { IKeyPairDID } from './key-pair-did';

export class DIDWeb extends DIDBase {
  private id: string = uuidv4();
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    public options: OptionsDto = {
      clientSecretMode: false,
      network: undefined,
    },
    public domain: string = 'did-web.securevalue.exchange'
  ) {
    super(SupportedDidMethod.WEB, didDocument, options);
    this.didDocument = { ...super.didDocument, id: `did:web:${domain}:${this.id}` };
  }

  setVerificationMethod() {
    const id = `did:web:${this.domain}:${this.id}#key-1`;
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
