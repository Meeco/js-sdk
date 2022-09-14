import { DidDocumentDto } from '@meeco/identity-network-api-sdk';
import { DIDRequestHandler } from '../../util/did-management/did-action-handler';
import { GetVerificationMethodActionHandler } from '../../util/did-management/get-verification-method-action-handler';
import { SigningRequestActionHandler } from '../../util/did-management/signing-request-action-handler';
import { NewDID, SupportedNetwork, SupportedDidMethod } from './new-did';
import { IKeyPairDID } from './key-pair-did';

export class SOV extends NewDID {
  constructor(
    public didDocument: DidDocumentDto,
    public keyPair: IKeyPairDID,
    public network: SupportedNetwork = SupportedNetwork.DANUBE
  ) {
    super(SupportedDidMethod.SOV, network, didDocument);
  }
  getHandlerChain(): DIDRequestHandler {
    const verificationMethod = new GetVerificationMethodActionHandler(this);
    const signingRequestAttrib = new SigningRequestActionHandler(this);

    verificationMethod.setNextHandler(signingRequestAttrib);

    return verificationMethod;
  }
}
