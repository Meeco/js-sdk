import { Secrets, UserService } from '@meeco/sdk';
import { CliUx, Flags as _flags } from '@oclif/core';
import { AuthConfig } from '../../configs/auth-config';
import MeecoCommand from '../../util/meeco-command';

export default class CreateUser extends MeecoCommand {
  static description =
    'Create a new Meeco user against the various microservices using only a password. Outputs an Authorization config file for use with future commands.';
  static examples = [`meeco users:create -p My$ecretPassword1`];

  static flags = {
    ...MeecoCommand.flags,
    password: _flags.string({
      char: 'p',
      description: 'Password to use for the new user (will be prompted for if not provided)',
      required: false,
    }),
    secret: _flags.string({
      hidden: true,
      char: 's',
      description: 'Manual secret to use (for testing purposes)',
      required: false,
    }),
    port: _flags.integer({
      default: 5210,
      description: 'Port to listen on for captcha response (optional - use if 5210 is reserved)',
    }),
  };

  async run() {
    const { flags } = await this.parse(this.constructor as typeof CreateUser);
    let { password, secret } = flags;
    // const { port } = flags;

    try {
      const environment = await this.readEnvironmentFile();
      const userService = new UserService(environment, this.updateStatus);
      // const captchaService = new CaptchaService(environment, port);

      if (!password) {
        while (!password) {
          password = await CliUx.ux.prompt('Enter a new password', { type: 'hide' });
        }
      }

      if (!secret) {
        // const captchaToken = await captchaService.requestCaptchaToken();
        const username = await userService.generateUsername();
        secret = await Secrets.generateSecret(username);
      }

      const result = await userService.create(password, secret);
      this.printYaml(AuthConfig.encodeFromAuthData(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}
