import { AuthData } from './auth-data';

export interface IConnectionMetadata {
  toName: string;
  fromName: string;
}

export class ConnectionCreateData {
  constructor(public from: AuthData, public to: AuthData, public options: IConnectionMetadata) {}
}
