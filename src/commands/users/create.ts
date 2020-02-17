import { flags as _flags } from '@oclif/command';
import cli from 'cli-ux';
import { SecretService } from '../../services/secret-service';
import { UserService } from '../../services/user-service';
import MeecoCommand from '../../util/meeco-command';

export default class CreateUser extends MeecoCommand {
  static description = 'Create a new Meeco user against the various microservices';
  static examples = [`meeco users:create -c path/to/user-config.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    password: _flags.string({
      char: 'p',
      description: 'Password to use for the new user',
      required: false
    }),
    secret: _flags.string({
      hidden: true,
      char: 's',
      description: 'Manual secret to use (for testing purposes)',
      required: false
    })
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof CreateUser);
    let { password, secret } = flags;
    if (!secret) {
      secret = await new SecretService().generateSecret();
    }

    if (!password) {
      while (!password) {
        password = await cli.prompt('Enter a new password', { type: 'hide' });
      }
    }

    const environment = await this.readEnvironmentFile();
    const service = new UserService(environment, this.updateStatus);
    try {
      const result = await service.create(password, secret);
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}
