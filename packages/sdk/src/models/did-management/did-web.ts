import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { IKeyPairDID } from './key-pair-did';
import { DIDBase, SupportedDidMethod } from './did-base';

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

    // add verification method, if not present
    if (!this.didDocument.verificationMethod) {
      this.didDocument.verificationMethod = [
        {
          id: `#key-1`,
          type: 'Ed25519VerificationKey2018',
          publicKeyBase58: this.keyPair.getPublicKeyBase58(),
        },
      ];
    }
  }

  getCreateHandlerChain(): undefined {
    return undefined;
  }
}
