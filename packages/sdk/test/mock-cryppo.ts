import { _cryppoService } from '@meeco/sdk';
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

      sandbox.stub(<any>_cryppoService, 'generateDerivedKey').callsFake(args => {
        return Promise.resolve({
          key: `derived_key_${args.key}`,
          options: <any>{
            serialize() {
              return `serialized.derivation.artifacts.${args.key}`;
            },
          },
        });
      });

      sandbox.stub(<any>_cryppoService, 'generateEncryptionVerificationArtifacts').callsFake(() => {
        return {
          token: 'token',
          salt: 'salt',
        };
      });

      // deprecated
      sandbox.stub(<any>_cryppoService, 'encryptWithKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][encrypted]${args.data}[with ${args.key}]`,
          encrypted: `[encrypted]${args.data}`,
        });
      });

      sandbox.stub(<any>_cryppoService, 'encryptStringWithKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][encrypted]${args.data}[with ${args.key}]`,
          encrypted: `[encrypted]${args.data}`,
        });
      });

      sandbox.stub(<any>_cryppoService, 'encryptBinaryWithKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][encrypted]${args.data}[with ${args.key}]`,
          encrypted: `[encrypted]${args.data}`,
        });
      });

      sandbox.stub(<any>_cryppoService, 'encryptWithPublicKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][rsa_encrypted]${args.data}[with ${args.publicKeyPem}]`,
          encrypted: `[rsa_encrypted]${args.data}`,
        });
      });

      const simpleDecrypt = args => {
        return Promise.resolve(`${args.serialized}[decrypted with ${args.key}]`);
      };

      // deprecated
      sandbox.stub(<any>_cryppoService, 'decryptWithKey').callsFake(simpleDecrypt);

      sandbox.stub(<any>_cryppoService, 'decryptStringWithKey').callsFake(simpleDecrypt);

      sandbox.stub(<any>_cryppoService, 'decryptBinaryWithKey').callsFake(simpleDecrypt);

      sandbox.stub(<any>_cryppoService, 'signWithPrivateKey').callsFake((pem, data) => {
        return {
          signature: `${data}[signed with ${pem}]`,
          serialized: `[serialized]${data}[signed with ${pem}]`,
          data,
          keySize: 4096,
        };
      });

      sandbox.stub(<any>_cryppoService, 'encodeDerivationArtifacts').callsFake((args: any) => {
        return `${args.token}.${args.encrypted}`;
      });

      sandbox.stub(<any>_cryppoService, 'generateRandomKey').callsFake((args: any) => {
        return `randomly_generated_key`;
      });

      sandbox.stub(<any>_cryppoService, 'generateRSAKeyPair').callsFake(() => {
        return Promise.resolve({
          privateKey: '--PRIVATE_KEY--12324',
          publicKey: '--PUBLIC_KEY--ABCD',
          bits: 256,
        });
      });

      sandbox.stub(<any>_cryppoService, 'decryptSerializedWithPrivateKey').callsFake(args => {
        return Promise.resolve(`[decrypted]${args.serialized}${args.privateKeyPem}`);
      });
    },
    finally: () => {
      sandbox.restore();
      _stubbed = false;
    },
  };
}
