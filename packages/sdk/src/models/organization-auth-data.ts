/**
 * `AuthData` is a container for all the data required to perform actions on behalf of a Meeco User.
 *
 * *Note:* Actual `AuthData` passed to method calls doesn't need to be an instance of this class - it can just conform to the interface.
 */
export class OrganizationAuthData {
  public vault_access_token: string;
  constructor(config: { vault_access_token: string }) {
    this.vault_access_token = config.vault_access_token;
  }

  /**
   * Create a new AuthData instance from a serialized version
   */
  static fromJSON(json: any) {
    return new OrganizationAuthData({
      vault_access_token: json.vault_access_token,
    });
  }

  /**
   * Allow AuthData to be serialized for easier storage
   */
  toJSON() {
    return {
      vault_access_token: this.vault_access_token,
    };
  }
}
