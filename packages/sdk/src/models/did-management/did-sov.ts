import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { DIDRequestHandler } from '../../util/did-management/did-action-handler';
import { GetVerificationMethodActionHandler } from '../../util/did-management/get-verification-method-action-handler';
import { SigningRequestAttribActionHandler } from '../../util/did-management/signing-request-attrib-action-handler';
import { NewDID, SupportedNetwork, SupportedDidMethod, SupportedOptions } from './new-did';
import { IKeyPairDID } from './key-pair-did';
import { SigningRequestNymActionHandler } from '../../util/did-management/signing-request-nym-action-handler';

export class DIDSov extends NewDID {
  constructor(
    public keyPair: IKeyPairDID,
    public didDocument: DidDocumentDto = {},
    options: SupportedOptions = {
      clientSecretMode: true,
      network: SupportedNetwork.DANUBE,
    }
  ) {
    super(SupportedDidMethod.SOV, didDocument, options);
  }
  getHandlerChain(): DIDRequestHandler {
    const verificationMethod = new GetVerificationMethodActionHandler(this);
    const signingRequestNym = new SigningRequestNymActionHandler(this);
    const signingRequestAttrib = new SigningRequestAttribActionHandler(this);

    verificationMethod.setNextHandler(signingRequestNym);
    signingRequestNym.setNextHandler(signingRequestAttrib);

    return verificationMethod;
  }
}
