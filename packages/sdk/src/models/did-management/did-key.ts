import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import {
  DidDto,
  DIDRequestHandler,
  DIDResultDto,
  GetVerificationMethodActionHandler,
} from '../../util/did-management';
import { DIDBase, SupportedDidMethod } from './did-base';
import { IKeyPairDID } from './key-pair-did';

export class DIDKey extends DIDBase {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: OptionsDto = {
      clientSecretMode: true,
      network: undefined,
      keyType: keyPair.getName(),
    }
  ) {
    super(SupportedDidMethod.KEY, didDocument, options);
  }

  getHandlerChain<
    TypeDIDResultDto extends DIDResultDto,
    TypeDidDto extends DidDto
  >(): DIDRequestHandler<TypeDIDResultDto, TypeDidDto> {
    const verificationMethod = new GetVerificationMethodActionHandler<TypeDIDResultDto, TypeDidDto>(
      this
    );

    return verificationMethod;
  }
}
