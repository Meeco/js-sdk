import { ShareService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { isAfter, isValid, parse } from 'date-fns';
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
    sharing_mode: _flags.string({
      char: 'm',
      default: 'owner',
      required: false,
      options: ['owner', 'anyone'],
      description:
        'There are two sharing_mode: owner and anyone \n owner - non-owner will not be able to on-share a share \n anyone - anyone allow to on-share a share.',
    }),
    acceptance_required: _flags.string({
      char: 't',
      default: 'acceptance_not_required',
      required: false,
      options: ['acceptance_not_required', 'acceptance_required'],
      description:
        'Some shares require that the recipient accepts the terms of the share. \n There are two acceptance_require: acceptance_not_required & acceptance_required \n acceptance_not_required - recipient dont require acceptance  \n acceptance_required - recipient require acceptance before viewing shared item.',
    }),
    expiry_date: _flags.string({
      char: 'd',
      description: 'Share expiry date: YYYY-MM-DD e.g. 2020-12-31',
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

      const parseDate = parse(expiry_date || '', 'yyyy-MM-dd', new Date());
      if (expiry_date) {
        if (!isValid(parseDate)) {
          this.error('Invalid Share Expiry Date');
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
