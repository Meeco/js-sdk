import { resolve } from './api';

export class IdentityNetwork {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public resolve(did: string) {
    return resolve(did, { baseUrl: this.baseUrl });
  }
}
