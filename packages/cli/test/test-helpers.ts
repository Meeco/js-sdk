import { SRPSession } from '@meeco/sdk';
import test from '@oclif/test';
import { join } from 'path';
import { createSandbox } from 'sinon';
import { _mockCryppo } from './mock-cryppo';

export const inputFixture = (fileName: string) => join(__dirname, 'fixtures', 'inputs', fileName);
export const outputFixture = (fileName: string) => join(__dirname, 'fixtures', 'outputs', fileName);
export const testUserAuth = ['-a', inputFixture('user-auth.input.yaml')];
export const testEnvironmentFile = ['-e', inputFixture('test-environment.input.yaml')];

export const customTest = test
  .register('mockCryppo', _mockCryppo)
  .register('run', runCommand)
  .register('mockSRP', mockSRP);

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
