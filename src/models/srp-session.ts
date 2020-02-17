import * as jsrp from 'jsrp';

export class SRPSession {
  private _client: jsrp.client | null;

  get client() {
    if (!this._client) {
      throw new Error('Must call SRPSession init() first');
    }
    return this._client;
  }

  constructor() {
    this._client = null;
  }

  async init(username, passwordDerivedFromPassphrase) {
    this._client = await this.getSrpClient(username, passwordDerivedFromPassphrase);
    return this;
  }

  /** "srp_a" value */
  async getClientPublic() {
    return this.client.getPublicKey();
  }

  /** "srp_m" or "proof" or  */
  async computeProofFromChallenge({ salt, serverPublic }: { salt: string; serverPublic: string }) {
    this.client.setSalt(salt);
    this.client.setServerPublicKey(serverPublic);
    return this.client.getProof();
  }

  async createVerifier(): Promise<{ verifier: string; salt: string }> {
    return new Promise(resolve => {
      this.client.createVerifier((err, result) => {
        resolve(result);
      });
    });
  }

  private getSrpClient(username, password): Promise<jsrp.client> {
    return new Promise(resolve => {
      const client = new jsrp.client();
      client.init({ username, password, length: 2048 }, () => {
        resolve(client);
      });
    });
  }
}
