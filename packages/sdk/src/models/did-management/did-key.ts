import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { IKeyPairDID } from './key-pair-did';
import { DIDBase, SupportedDidMethod } from './did-base';
import { DIDResultDto, DidDto, DIDRequestHandler } from '../../util/did-management';

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

  getHandlerChain<TypeDIDResultDto extends DIDResultDto, TypeDidDto extends DidDto>():
    | DIDRequestHandler<TypeDIDResultDto, TypeDidDto>
    | undefined {
    return undefined;
  }
}
