import { fetchConnectionWithId, ItemService, ShareService } from '@meeco/sdk';
import { Slot } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import { ShareConfig } from '../../configs/share-config';
import MeecoCommand from '../../util/meeco-command';

export default class SharesCreateConfig extends MeecoCommand {
  static description =
    'Provide two users and either an item id (direct share) or share id (on-share) to construct a share config file';

  static flags = {
    ...MeecoCommand.flags,
    itemId: _flags.string({
      required: false,
      char: 'i',
      description: `Item id of the 'from' user to share with the 'to' user`,
    }),
    onshareId: _flags.string({
      required: false,
      char: 'o',
      description: `Share ID of the share, which to on-share with the 'to' user`,
    }),
    from: _flags.string({
      required: true,
      char: 'f',
      description: `User config file for the 'from' user`,
    }),
    connectionId: _flags.string({
      required: true,
      char: 'c',
      description: `Connection id for the 'to' user`,
    }),
    slotName: _flags.string({
      required: false,
      char: 's',
      description: 'Name of slot to share (if sharing a single slot)',
    }),
  };

  static args = [];

  async run() {
    try {
      const { flags } = this.parse(this.constructor as typeof SharesCreateConfig);
      const { from, connectionId, onshareId, slotName, itemId } = flags;
      const environment = await this.readEnvironmentFile();
      const fromUser = await this.readConfigFromFile(AuthConfig, from);

      if (!fromUser || !connectionId) {
        throw new CLIError('Both a valid from and to user config file are required');
      }

      if (!(onshareId || itemId)) {
        throw new CLIError(
          `Either a on-share id (-o option) or an item id (-i option) is required`
        );
      }

      // this require refactor, this should return null when connection doesnot exists insted of throwing excepiton
      await fetchConnectionWithId(fromUser, connectionId, environment, this.updateStatus);

      let slots: Slot[];
      let resp: any;
      // Ensure the item to share exists first since setting up a first share takes a bit of work
      if (!itemId) {
        // The `as string` is safe here as we know that item id is undefined, shareId must be defined
        // or we would have errored above .
        resp = await new ShareService(environment).getSharedItemIncoming(
          fromUser,
          onshareId as string
        );
      } else {
        resp = await new ItemService(environment).get(itemId, fromUser).catch(err => {
          if (err.status === 404) {
            throw new CLIError(`Item with id '${itemId}' was not found on the 'from' user`);
          }
          throw err;
        });
      }

      const foundItemId = resp.item.id;
      slots = resp.slots as Slot[];

      let slotId: string | undefined;
      if (slotName) {
        slotId = slots.find(slot => slot.name === slotName)?.id;
        if (slotId === undefined) {
          throw new CLIError(`Slot with name '${slotName}' was not found on the item`);
        }
      }
      this.printYaml(
        ShareConfig.encodeFromUsersWithItem(fromUser, connectionId, foundItemId, slotId)
      );
    } catch (err) {
      await this.handleException(err);
    }
  }
}
