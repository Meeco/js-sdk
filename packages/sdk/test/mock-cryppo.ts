import {
  binaryStringToBytes,
  bytesToBinaryString,
  bytesToUtf8,
  EncryptionKey,
  utf8ToBytes,
} from '@meeco/cryppo';
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
          key: EncryptionKey.fromBytes(binaryStringToBytes(`derived_key_${args.passphrase}`)),
          options: <any>{
            serialize() {
              return `serialized.derivation.artifacts.${args.passphrase}`;
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

      sandbox.stub(<any>_cryppoService, 'encryptWithKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][encrypted]${bytesToUtf8(args.data)}[with ${bytesToBinaryString(
            args.key.bytes
          )}]`,
          encrypted: `[encrypted]${bytesToUtf8(args.data)}`,
        });
      });

      sandbox.stub(<any>_cryppoService, 'encryptWithPublicKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][rsa_encrypted]${args.data}[with ${args.publicKeyPem}]`,
          encrypted: `[rsa_encrypted]${args.data}`,
        });
      });

      const simpleDecrypt = args => {
        return Promise.resolve(
          utf8ToBytes(
            `${args.serialized}[decrypted with ${bytesToUtf8((args.key as EncryptionKey).bytes)}]`
          )
        );
      };

      sandbox.stub(<any>_cryppoService, 'decryptWithKey').callsFake(simpleDecrypt);

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

      sandbox.stub(<any>_cryppoService.EncryptionKey, 'generateRandom').callsFake((args: any) => {
        return EncryptionKey.fromBytes(binaryStringToBytes(`randomly_generated_key`));
      });

      sandbox.stub(<any>_cryppoService, 'generateRSAKeyPair').callsFake(() => {
        return Promise.resolve({
          privateKey: '-----BEGIN RSA PRIVATE KEY-----ABCD',
          publicKey: '-----BEGIN PUBLIC KEY-----ABCD',
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
