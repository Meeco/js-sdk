import { fetchConnectionWithId, ItemService, ShareService } from '@meeco/sdk';
import { NestedSlotAttributes, Slot } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import { ShareConfig } from '../../configs/share-config';
import MeecoCommand from '../../util/meeco-command';

export default class SharesCreateConfig extends MeecoCommand {
  static description = 'Provide two users and an item id to construct a share config file';

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
      const { from, connectionId, onshareId, slotName } = flags;
      let { itemId } = flags;
      const environment = await this.readEnvironmentFile();
      const fromUser = await this.readConfigFromFile(AuthConfig, from);

      if (!fromUser || !connectionId) {
        this.error('Both a valid from and to user config file are required');
      }

      if (!(onshareId || itemId)) {
        this.error('Either a on-share id (-o option) or an item id (-i option) is required');
      }

      await fetchConnectionWithId(fromUser, connectionId, environment, this.updateStatus);

      let slots: Array<{name: string, id: string}>

      // Ensure the item to share exists first since setting up a first share takes a bit of work
      if (!itemId) {
        // The `as string` is safe here as we know that item id is undefined, shareId must be defined
        // or we would have errored above .
        const resp = await (await new ShareService(environment).getSharedItemIncoming(fromUser, onshareId as string));
        // console.log('item.id', resp.item.id)
        // console.log('share.item_id', resp.share.item_id)
        // console.log('item.original_id', resp.item.original_id)
        itemId = resp.item.id
        slots = resp.slots as Slot[]
      } else {
        const resp = await new ItemService(environment)
        .get(itemId, fromUser.vault_access_token, fromUser.data_encryption_key)
        .catch(err => {
          if (err.status === 404) {
            throw new CLIError(`Item with id '${itemId}' was not found on the 'from' user`);
          }
          throw err;
        });
        itemId = resp.item.id
        slots = resp.slots.map(s => ({name: s.name as string, id: s.id as string}))
      }

      let slotId: string | undefined;
      if (slotName) {
        slotId = slots.find(slot => slot.name === slotName)?.id;
        if (slotId === undefined) {
          throw new CLIError(`Slot with name '${slotName}' was not found on the item`);
        }
      }
      this.printYaml(ShareConfig.encodeFromUsersWithItem(fromUser, connectionId, itemId, slotId));
    } catch (err) {
      await this.handleException(err);
    }
  }
}
