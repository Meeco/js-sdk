import {
  CipherStrategy,
  EncryptionKey,
  encryptWithKey,
  generateRSAKeyPair,
  utf8ToBytes,
} from '@meeco/cryppo';
import { DelegationService, mockableFactories } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { InvitationConfig } from '../../configs/invitation-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class DelegationCreateInvitation extends MeecoCommand {
  static description =
    'Create a delegation inivitation for another user to become a delegate connection';

  static args = [
    {
      name: 'recipient_name',
      required: true,
      description: 'Name of the user which the invitation is to be sent to',
    },
    {
      name: 'delegation_role',
      required: false,
      default: 'reader',
      description: 'delegation roles available are: owner, admin, and reader (default: reader)',
    },
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  async run() {
    const { flags, args } = await this.parse(this.constructor as typeof DelegationCreateInvitation);
    const { auth } = flags;
    const { delegation_role, recipient_name } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('authConfig must be present');
    }
    const keypairKey = await generateRSAKeyPair();
    const encryptedPrivateKey = await encryptWithKey({
      key: EncryptionKey.fromBytes(authConfig.data_encryption_key.key),
      data: utf8ToBytes(keypairKey.privateKey),
      strategy: CipherStrategy.AES_GCM,
    });

    const keypairApi = mockableFactories.keystoreAPIFactory(environment)(authConfig).KeypairApi;
    const { keypair } = await keypairApi.keypairsPost({
      public_key: keypairKey.publicKey,
      encrypted_serialized_key: encryptedPrivateKey.serialized || '',
      metadata: {},
      external_identifiers: [],
    });

    const userApi = mockableFactories.vaultAPIFactory(environment)(authConfig).UserApi;
    const { user } = await userApi.meGet();

    const delegationsService = new DelegationService(environment, this.updateStatus);
    const invitation = await delegationsService.createDelegationInvitation(
      authConfig,
      user.id,
      delegation_role,
      recipient_name,
      keypair.id
    );

    this.printYaml(InvitationConfig.encodeFromJSON(invitation));
  }
}
