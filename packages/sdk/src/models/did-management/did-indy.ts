import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import {
  DIDRequestHandler,
  DIDResultDto,
  DidDto,
} from '../../util/did-management/did-action-handler';
import { GetVerificationMethodActionHandler } from '../../util/did-management/get-verification-method-action-handler';
import { SigningRequestAttribActionHandler } from '../../util/did-management/signing-request-attrib-action-handler';
import { SigningRequestNymActionHandler } from '../../util/did-management/signing-request-nym-action-handler';
import { DIDBase, SupportedDidMethod, SupportedNetwork } from './did-base';
import { IKeyPairDID } from './key-pair-did';

export class DIDIndy extends DIDBase {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: OptionsDto = {
      clientSecretMode: true,
      network: SupportedNetwork.DANUBE,
    }
  ) {
    super(SupportedDidMethod.INDY, didDocument, options);
  }

  getHandlerChain<
    TypeDIDResultDto extends DIDResultDto,
    TypeDidDto extends DidDto
  >(): DIDRequestHandler<TypeDIDResultDto, TypeDidDto> {
    const verificationMethod = new GetVerificationMethodActionHandler<TypeDIDResultDto, TypeDidDto>(
      this
    );
    const signingRequestNym = new SigningRequestNymActionHandler<TypeDIDResultDto, TypeDidDto>(
      this
    );
    const signingRequestAttrib = new SigningRequestAttribActionHandler<
      TypeDIDResultDto,
      TypeDidDto
    >(this);

    verificationMethod.setNextHandler(signingRequestNym);
    signingRequestNym.setNextHandler(signingRequestAttrib);

    return verificationMethod;
  }
}
