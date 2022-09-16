import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { NewDID, SupportedDidMethod, SupportedOptions } from './new-did';
import { IKeyPairDID } from './key-pair-did';

export class DIDWeb extends NewDID {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: SupportedOptions = {
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

  getHandlerChain(): undefined {
    return undefined;
  }
}
