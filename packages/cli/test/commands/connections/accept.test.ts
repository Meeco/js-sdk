import { InvitationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import sinon from 'sinon';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('connections:accept', () => {
  const fakeName = 'new name';
  const fakeToken = 'token';

  const acceptStub = sinon.stub().resolves({ own: {}, the_other_user: {} });

  customTest
    .stub(InvitationService.prototype, 'accept', acceptStub)
    .stdout()
    .run(['connections:accept', ...testUserAuth, ...testEnvironmentFile, '-n', fakeName, fakeToken])
    .it('accepts a named connection', async () => {
      expect(acceptStub.lastCall.args[1]).to.equal(fakeName);
      expect(acceptStub.lastCall.args[2]).to.equal(fakeToken);
    });

  customTest
    .stub(InvitationService.prototype, 'accept', acceptStub)
    .stdout()
    .run(['connections:accept', ...testUserAuth, ...testEnvironmentFile, fakeToken])
    .it('accepts a connection with a default name', () => {
      // tslint:disable-next-line:no-unused-expression
      expect(acceptStub.lastCall.args[1]).to.exist;
      expect(acceptStub.lastCall.args[2]).to.equal(fakeToken);
    });
});
