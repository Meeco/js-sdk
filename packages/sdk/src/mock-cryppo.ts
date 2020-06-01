import { createSandbox } from 'sinon';
import cryppo from './services/cryppo-service';

let _stubbed = false;
export function _mockCryppo() {
  const sandbox = createSandbox();
  return {
    run: () => {
      if (_stubbed) {
        return;
      }
      _stubbed = true;

      sandbox.stub(cryppo, 'generateDerivedKey').callsFake(args => {
        return Promise.resolve({
          key: `derived_key_${args.key}`,
          options: <any>{
            serialize() {
              return `serialized.derivation.artifacts.${args.key}`;
            }
          }
        });
      });

      sandbox.stub(cryppo, 'generateEncryptionVerificationArtifacts').callsFake(() => {
        return {
          token: 'token',
          salt: 'salt'
        };
      });

      sandbox.stub(cryppo, 'encryptWithKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][encrypted]${args.data}[with ${args.key}]`,
          encrypted: `[encrypted]${args.data}`
        });
      });

      sandbox.stub(cryppo, 'encryptWithPublicKey').callsFake(args => {
        return Promise.resolve({
          serialized: `[serialized][rsa_encrypted]${args.data}[with ${args.publicKeyPem}]`,
          encrypted: `[rsa_encrypted]${args.data}`
        });
      });

      sandbox.stub(cryppo, 'decryptWithKey').callsFake(args => {
        return Promise.resolve(
          `${args.serialized}[decrypted with ${args.key}]`
        );
      });

      sandbox.stub(cryppo, 'signWithPrivateKey').callsFake((pem, data) => {
        return {
          signature: `${data}[signed with ${pem}]`,
          serialized: `[serialized]${data}[signed with ${pem}]`,
          data,
          keySize: 4096
        };
      });

      sandbox.stub(cryppo, 'encodeDerivationArtifacts').callsFake((args: any) => {
        return `${args.token}.${args.encrypted}`;
      });

      sandbox.stub(cryppo, 'generateRandomKey').callsFake((args: any) => {
        return `randomly_generated_key`;
      });

      sandbox.stub(cryppo, 'generateRSAKeyPair').callsFake(() => {
        return Promise.resolve({
          privateKey: '--PRIVATE_KEY--12324',
          publicKey: '--PUBLIC_KEY--ABCD',
          bits: 256
        });
      });

      sandbox.stub(cryppo, 'decryptSerializedWithPrivateKey').callsFake(args => {
        return Promise.resolve(`[decrypted]${args.serialized}${args.privateKeyPem}`);
      });
    },
    finally: () => {
      sandbox.restore();
      _stubbed = false;
    }
  };
}
