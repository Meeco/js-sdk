import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { NewDID, SupportedNetwork, SupportedDidMethod } from './new-did';
import { IKeyPairDID } from './key-pair-did';

export class DIDWeb extends NewDID {
  constructor(
    public didDocument: DidDocumentDto,
    public keyPair: IKeyPairDID,
    public network: SupportedNetwork = SupportedNetwork.NONE
  ) {
    super(SupportedDidMethod.WEB, network, didDocument);

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

  getHandlerChain() {
    return undefined;
  }
}
