import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { NewDID, SupportedNetwork, SupportedDidMethod } from './new-did';
import { IKeyPairDID } from './key-pair-did';

export class DIDKey extends NewDID {
  constructor(
    public didDocument: DidDocumentDto,
    public keyPair: IKeyPairDID,
    public network: SupportedNetwork = SupportedNetwork.NONE
  ) {
    super(SupportedDidMethod.KEY, network, didDocument);
  }

  getHandlerChain() {
    return undefined;
  }
}
