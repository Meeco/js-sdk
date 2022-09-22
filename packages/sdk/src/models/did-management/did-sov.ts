import { DidDocumentDto, OptionsDto } from '@meeco/identity-network-api-sdk';
import { DIDRequestHandler } from '../../util/did-management/did-action-handler';
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
  getCreateHandlerChain(): DIDRequestHandler {
    const verificationMethod = new GetVerificationMethodActionHandler(this);
    const signingRequestNym = new SigningRequestNymActionHandler(this);
    const signingRequestAttrib = new SigningRequestAttribActionHandler(this);

    verificationMethod.setNextHandler(signingRequestNym);
    signingRequestNym.setNextHandler(signingRequestAttrib);

    return verificationMethod;
  }

  getUpdateHandlerChain(): DIDRequestHandler {
    const signingRequestNym = new SigningRequestNymActionHandler(this);
    const signingRequestAttrib = new SigningRequestAttribActionHandler(this);

    signingRequestNym.setNextHandler(signingRequestAttrib);

    return signingRequestNym;
  }

  getDeleteHandlerChain(): DIDRequestHandler {
    const signingRequestNym = new SigningRequestNymActionHandler(this);

    return signingRequestNym;
  }
}
