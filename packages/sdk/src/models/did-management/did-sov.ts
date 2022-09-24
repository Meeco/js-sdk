import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import {
  DidDto,
  DIDRequestHandler,
  DIDResultDto,
} from '../../util/did-management/did-action-handler';
import { GetVerificationMethodActionHandler } from '../../util/did-management/get-verification-method-action-handler';
import { SigningRequestAttribActionHandler } from '../../util/did-management/signing-request-attrib-action-handler';
import { SigningRequestNymActionHandler } from '../../util/did-management/signing-request-nym-action-handler';
import { IKeyPairDID } from './key-pair-did';
import { DIDBase, SupportedDidMethod, SupportedNetwork } from './did-base';

export class DIDSov extends DIDBase {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: OptionsDto = {
      clientSecretMode: true,
      network: SupportedNetwork.DANUBE,
    }
  ) {
    super(SupportedDidMethod.SOV, didDocument, options);
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
