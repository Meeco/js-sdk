import * as bodyParser from 'body-parser';
import cli from 'cli-ux';
import * as express from 'express';
import { Server } from 'http';
import { Environment } from '../models/environment';

export class CaptchaService {
  private server?: express.Express;
  private app?: Server;
  private tokenResult?: Promise<string>;
  private tokenReady?: (token: string) => void;

  constructor(private environment: Environment, private port = 5210) {}

  public async requestCaptchaToken(): Promise<string> {
    cli.action.start('Starting server');
    await this.startServer();
    await cli.open(
      `${this.environment.keystore.url}/home/captcha_callback_form?redirect_url=http://localhost:${this.port}&subscription-key=${this.environment.keystore.subscription_key}`
    );
    cli.action.start('Please solve captcha in the browser - waiting for CAPTCHA token');
    const token = await this.tokenResult!;
    await this.stopServer();
    cli.action.start('Got token');
    return token;
  }

  private startServer(): Promise<void> {
    if (this.server) {
      return Promise.resolve();
    }

    this.tokenResult = new Promise(res => (this.tokenReady = res));

    this.server = express();
    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: true }));
    this.server.post('/', (req, res) => {
      this.tokenReady!(req.body['g-recaptcha-response']);
      res.send(`You may now close this browser tab and return to the terminal`);
    });

    return new Promise((res, rej) => {
      this.app = this.server!.listen(this.port, err => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  }

  private stopServer() {
    if (!this.server) {
      return;
    }

    this.app?.close();
    this.reset();
  }

  private reset() {
    this.app = undefined;
    this.server = undefined;
    this.tokenResult = undefined;
    this.tokenReady = undefined;
  }
}
