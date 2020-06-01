import * as _cryppo from '@meeco/cryppo';
import { createSandbox } from 'sinon';

let _stubbed = false;
export function _mockCryppo() {
  const sandbox = createSandbox();
  return {
    run: () => {
      if (_stubbed) {
        return;
      }
      _stubbed = true;
      const cryppo: any = {
        CipherStrategy: _cryppo.CipherStrategy
      };
      (<any>global).cryppo = cryppo;
      (<any>cryppo).generateDerivedKey = args => {
        return Promise.resolve({
          key: `derived_key_${args.key}`,
          options: <any>{
            serialize() {
              return `serialized.derivation.artifacts.${args.key}`;
            }
          }
        });
      };

      (<any>cryppo).generateEncryptionVerificationArtifacts = () => {
        return {
          token: 'token',
          salt: 'salt'
        };
      };

      (<any>cryppo).encryptWithKey = args => {
        return Promise.resolve({
          serialized: `[serialized][encrypted]${args.data}[with ${args.key}]`,
          encrypted: `[encrypted]${args.data}`
        });
      };

      (<any>cryppo).encryptWithPublicKey = args => {
        return Promise.resolve({
          serialized: `[serialized][rsa_encrypted]${args.data}[with ${args.publicKeyPem}]`,
          encrypted: `[rsa_encrypted]${args.data}`
        });
      };

      (<any>cryppo).decryptWithKey = args => {
        return Promise.resolve(`${args.serialized}[decrypted with ${args.key}]`);
      };

      (<any>cryppo).signWithPrivateKey = (pem, data) => {
        return {
          signature: `${data}[signed with ${pem}]`,
          serialized: `[serialized]${data}[signed with ${pem}]`,
          data,
          keySize: 4096
        };
      };

      (<any>cryppo).encodeDerivationArtifacts = (args: any) => {
        return `${args.token}.${args.encrypted}`;
      };

      (<any>cryppo).generateRandomKey = (args: any) => {
        return `randomly_generated_key`;
      };

      (<any>cryppo).generateRSAKeyPair = () => {
        return Promise.resolve({
          privateKey: '--PRIVATE_KEY--12324',
          publicKey: '--PUBLIC_KEY--ABCD',
          bits: 256
        });
      };

      (<any>cryppo).decryptSerializedWithPrivateKey = args => {
        return Promise.resolve(`[decrypted]${args.serialized}${args.privateKeyPem}`);
      };
    },
    finally: () => {
      sandbox.restore();
      _stubbed = false;
    }
  };
}
