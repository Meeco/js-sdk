import { AcceptanceStatus, ShareService, SharingMode } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { isAfter, isValid, parse, parseISO } from 'date-fns';
import { ShareConfig } from '../../configs/share-config';
import MeecoCommand from '../../util/meeco-command';

export default class SharesCreate extends MeecoCommand {
  static description = 'Share an item between two users';

  static flags = {
    ...MeecoCommand.flags,
    config: _flags.string({
      char: 'c',
      description: 'Share config file to use for setting up the share',
      required: true,
    }),
    sharing_mode: _flags.enum({
      char: 'm',
      default: SharingMode.owner,
      required: false,
      options: Object.values(SharingMode),
      description: 'If set to anyone, allows a share recipient to share this Item again.',
    }),
    acceptance_required: _flags.enum({
      char: 't',
      default: AcceptanceStatus.notRequired,
      required: false,
      options: Object.values(AcceptanceStatus),
      description: `If set to 'acceptance_required' then recipient must accept share terms before decrypting the shared item.`,
    }),
    expiry_date: _flags.string({
      char: 'd',
      description: 'Share expiry date either ISO-8601 or yyyy-MM-dd short format e.g. 2020-12-31',
      required: false,
    }),
  };

  static args = [{ name: 'file' }];

  async run() {
    const { flags } = this.parse(SharesCreate);
    const { config, sharing_mode, acceptance_required, expiry_date } = flags;

    try {
      const environment = await this.readEnvironmentFile();
      const share = await this.readConfigFromFile(ShareConfig, config);

      let parseDate: Date | undefined;

      if (expiry_date) {
        parseDate = parse(expiry_date!, 'yyyy-MM-dd', new Date());
        if (!isValid(parseDate)) {
          parseDate = parseISO(expiry_date!);
        }
        if (!isValid(parseDate)) {
          this.error('Invalid Share Expiry Date - please provide either yyyy-MM-dd or ISO format');
        } else if (isAfter(new Date(), parseDate)) {
          this.error('Share Expiry Date must be future date');
        }
      }

      if (!share) {
        this.error('Must specify valid share config file');
      }

      const service = new ShareService(environment, this.updateStatus);

      const result = await service.shareItem(share.from, share.connectionId, share.itemId, {
        expires_at: expiry_date ? parseDate : undefined,
        sharing_mode,
        acceptance_required,
        ...(share.slotId ? { slot_id: share.slotId } : {}),
      });
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}
