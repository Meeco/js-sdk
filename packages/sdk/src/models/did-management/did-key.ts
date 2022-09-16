import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { NewDID, SupportedDidMethod, SupportedOptions } from './new-did';
import { IKeyPairDID } from './key-pair-did';

export class DIDKey extends NewDID {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: SupportedOptions = {
      clientSecretMode: false,
      network: undefined,
    }
  ) {
    super(SupportedDidMethod.KEY, didDocument, options);
  }

  getHandlerChain(): undefined {
    return undefined;
  }
}
