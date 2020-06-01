import * as cryppo from '@meeco/cryppo';
import test from '@oclif/test';
import { join } from 'path';
import { createSandbox } from 'sinon';
import { SRPSession } from '../src/models/srp-session';

export const inputFixture = (fileName: string) => join(__dirname, 'fixtures', 'inputs', fileName);
export const outputFixture = (fileName: string) => join(__dirname, 'fixtures', 'outputs', fileName);
export const testUserAuth = ['-a', inputFixture('user-auth.input.yaml')];
export const testEnvironmentFile = ['-e', inputFixture('test-environment.input.yaml')];

export const customTest = test
  .register('mockCryppo', mockCryppo)
  .register('run', runCommand)
  .register('mockSRP', mockSRP);

let _stubbed = false;
export function mockCryppo() {
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
        return Promise.resolve(`${args.serialized}[decrypted with ${args.key}]`);
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

export function mockSRP() {
  const sandbox = createSandbox();
  return {
    run: () => {
      sandbox.stub(SRPSession.prototype, 'createVerifier').callsFake(() => {
        return Promise.resolve({
          verifier: '000000000VERIFIER',
          salt: '00SALT'
        });
      });
      sandbox.stub(SRPSession.prototype, 'getClientPublic').callsFake(() => {
        return Promise.resolve('000000000CLIENTPUBLIC');
      });
      sandbox.stub(SRPSession.prototype, 'computeProofFromChallenge').callsFake(args => {
        return Promise.resolve(`${args.salt}:${args.serverPublic}:PROOF`);
      });
    },
    finally: () => {
      sandbox.restore();
      _stubbed = false;
    }
  };
}

/**
 * There is an issue with the built-in `command()` helper that oclif
 * provides which makes source maps go out of whack.
 * This is a bit hacky but at least lets you run tests with source maps
 *
 * https://github.com/oclif/test/issues/50
 */
function runCommand(args: string[]) {
  const [command, ...argv] = args;
  const relativePath = command.split(':');
  const fullPath = join(__dirname, '../src/commands/', ...relativePath);
  const ctor = require(fullPath).default;
  return {
    async run(ctx) {
      return ctor.run(argv);
    }
  };
}
