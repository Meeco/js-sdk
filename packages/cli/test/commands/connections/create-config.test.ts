import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, inputFixture, outputFixture } from '../../test-helpers';

describe('connections:create-config', () => {
  customTest
    .stdout()
    .stderr()
    .run([
      'connections:create-config',
      '-f',
      inputFixture('connection-from.input.yaml'),
      '-t',
      inputFixture('connection-to.input.yaml'),
    ])
    .it('builds an connection template from two user auth files', ctx => {
      const expected = readFileSync(outputFixture('create-config-connection.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});
