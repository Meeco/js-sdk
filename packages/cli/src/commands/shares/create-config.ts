import { ConnectionService, SDKDecryptedSlot } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import { ExistingConnectionConfig } from '../../configs/existing-connection-config';
import { ShareConfig } from '../../configs/share-config';
import MeecoCommand from '../../util/meeco-command';

export default class SharesCreateConfig extends MeecoCommand {
  static description = 'Provide two users and either an item id to construct a share config file';

  static flags = {
    ...MeecoCommand.flags,
    item: _flags.string({
      required: true,
      char: 'i',
      description: `Config file for the Item to share with the 'to' user. This may be a shared Item.`,
    }),
    from: _flags.string({
      required: true,
      char: 'f',
      description: `User config file for the 'from' user`,
    }),
    connection: _flags.string({
      required: true,
      char: 'c',
      description: `Connection config file`,
    }),
    slotName: _flags.string({
      required: false,
      char: 's',
      description: 'Name of slot to share, if sharing a single slot',
    }),
  };

  //   static args = [];

  async run() {
    try {
      const { flags } = this.parse(this.constructor as typeof SharesCreateConfig);
      const { from, connection, slotName, item } = flags;
      const environment = await this.readEnvironmentFile();
      let fromUser = (await this.readConfigFromFile(AuthConfig, from))?.overrideWithFlags(flags);
      if (!fromUser) {
        this.error('Valid auth config file must be supplied');
      }
      fromUser = this.returnDelegationAuthIfDelegationIdPresent(fromUser);
      const connectionConfig = await this.readConfigFromFile(ExistingConnectionConfig, connection);
      const itemConfigFile = await this.readYamlFile(item);

      if (!connectionConfig || !itemConfigFile) {
        throw new CLIError('Invalid config file');
      }

      const connectionId = connectionConfig.from_user_connection_id;

      await new ConnectionService(environment, this.updateStatus)
        .get(fromUser, connectionId)
        .then(() => {
          const slots = (itemConfigFile as any).spec.slots as SDKDecryptedSlot[];
          const itemId = (itemConfigFile as any).spec.id as string;

          let slotId: string | undefined;
          if (slotName) {
            slotId = slots.find(slot => slot.name === slotName)?.id;
            if (slotId === undefined) {
              throw new CLIError(`Slot with name '${slotName}' was not found on the item`);
            }
          }
          if (!fromUser) {
            throw new Error('fromUser not found');
          }

          this.printYaml(
            ShareConfig.encodeFromUsersWithItem(fromUser, connectionId, itemId, slotId)
          );
          this.finish();
        });
    } catch (err) {
      await this.handleException(err);
    }
  }
}
