import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { IKeyPairDID } from './key-pair-did';
import { DIDBase, SupportedDidMethod } from './did-base';

export class DIDKey extends DIDBase {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: OptionsDto = {
      clientSecretMode: false,
      network: undefined,
    }
  ) {
    super(SupportedDidMethod.KEY, didDocument, options);
  }
}
