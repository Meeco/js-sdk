import { ShareService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import sinon from 'sinon';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('shares:get-incoming', () => {
  const shareId = '9ff995b7-660a-433a-9c84-809eda70db7f';
  const stub = sinon.stub();
  stub.withArgs(sinon.match.any, shareId).returns({ item: { slots: [] } });
  stub.throws();

  customTest
    .stdout()
    .stderr()
    .stub(ShareService.prototype, 'getSharedItem', stub)
    .run(['shares:get-incoming', ...testUserAuth, ...testEnvironmentFile, shareId])
    .it('calls ShareService.getSharedItem', () => {
      // tslint:disable-next-line:no-unused-expression
      expect(stub.called).to.be.true;
    });
});
