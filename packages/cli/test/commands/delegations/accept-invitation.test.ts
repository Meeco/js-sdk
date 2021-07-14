import { DelegationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('delegations:accept-invitation', () => {
  customTest
    .stdout()
    .stderr()
    .stub(
      DelegationService.prototype,
      'claimDelegationInvitation',
      claimDelegationInvitation as any
    )
    .run([
      'delegations:accept-invitation',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-c',
      inputFixture('delegations-accept-invitation.input.yaml'),
      'Riker',
    ])
    .it('accepts a delegation connection invitation', ctx => {
      const expected = readFileSync(
        outputFixture('delegations-accept-invitation.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function claimDelegationInvitation(authConfig, recipient_name, invitationToken) {
  return Promise.resolve({
    own: {
      id: 'a2b78a17-8033-4afc-bcbe-728a4386fbc4',
      encrypted_recipient_name:
        'Aes256Gcm.LIIzwfk=.QUAAAAAFaXYADAAAAAAS-2WPy4OLYGoP8S8FYXQAEAAAAAA4OODPFr4IExFBJ6P0-qTPAmFkAAUAAABub25lAAA=',
      integration_data: null,
      connection_type: null,
      user_id: '7b2a5f76-da09-4395-8a0f-9d5d0801faae',
      user_type: 'human',
      user_public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtYgW/YrF82ZFlOcMLx0P\r\ne8XwqOQ/wv3VQoHiqECEGbzHGm17wi7IAiLa157jHDJB6GqC0vNxNUyJOczM+SaF\r\nzHiEM8hm0Hpuoc8SwLSrm9XrphHhRi8KPhhmE9tULr06xc3M4yCoUa0yF8NHOfPA\r\nKAsAN7E9aCjzdZgqaVAVxC7MfbKReK9m0IzuKYs96kNOVspWKnMiZTzYA7I9LXkz\r\nHXKedr8/mjE4dRKT+2zxO6mHzyntOaQKNFfqZHHCTJYodubheUwYFcipO0IWI09i\r\npC94Vdh11J1ksWRIPDLEuyrtXc6JA73gX09r4vsfSqWOHdBQO4Q8wDaMNWHaQNfY\r\nfHBA3yB1RfA7GgfdypEdRCBnGem8JfXgJLT6axgNV4+OiSti7kjRZTHUdR7rN/t/\r\ns9B/v3HKZKYOY7BHkSt9yLpsadyZN4IygPSqFNYeVx+XBRX7IKDkwlGz3Jmw+z9B\r\nlU6dn4qHlcvUyIZRwE2wrIZ/1MSy+dweZubTCebvCjpoaMo4i9wBTUmoqB/chC/D\r\nUhSpQbWpqONFOnROiys01pBgYn6e3YxD6XLsEvAk/5U0CohLgn6SEOhepF5R/9+7\r\nM48MFSMZ9hxO6u7Ha/L+nzBsX7FcQBLVyrzdHBBqQ2O5mwSybqrRe+PE2aQadeDk\r\nLgGMnJZeV3a0Z/PRr46Aye8CAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
      user_keypair_external_id: '02826915-966a-4001-bab6-e53d03471f6c',
    },
    the_other_user: {
      id: '2322b5ed-7933-4ce4-9e1c-83f65eff79aa',
      integration_data: {
        role: 'reader',
        intent: 'delegate',
        delegation_token: '309963f7-a103-496b-a136-ce78b9fbcbd0',
      },
      connection_type: 'delegate',
      user_id: '223009b5-bd8f-454b-b117-33f553e5ee06',
      user_type: 'human',
      user_public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0Pu/FrBFCUF1TdbOj6dL\r\nT9tDqbuzqGlG5Rk0gH+NheIb2doO9ouinu3tlqR87p3KAkP5HaXLAlY9pH1d0ZbZ\r\nUPVuaY9rktbhZaTqEWmOjRkcxOMRFEgMWyCml7x0CvL933DaII3VVinf5qhqivpJ\r\nRWf5poPCStIKbjEZlYCEXdefFJK6WHpOrXvLCREH5Sf+kHpgWokxJQYFG73/Zwd1\r\nkLV/WBT8BLhI9pBzioAx73vbXUuFeQVGlO0r62KLdRC5kDIUUuMeQ5jZUM5V0aoe\r\ngFwTI+cJfeONR3PKfugYU3/E5b771Pqx9wus/7ElyyCVL1/uGzdxgM4bWLKKWjVb\r\n9Uqi0Lmuae1m3Q/FTR/r6DtndRDYMQ/tfP6txhaaoIVod1I8MgfmTqqCAN8ccQcH\r\ny6H+07cMdXfFrnJ6iGlWoKMs9VcHQjfjKb8x10O6+5pKKhd/mLeF8mo172oNsMFB\r\nacacMIsK1yatENB92ZBCPFWWSRIsa3zhL9HCPeUq3hFFYaaMdiu7jJlpiKdR9UL1\r\nOyxqZNgw8Zpd5vOcxX39ZMgXfEVJ2LoxTzkABMf6fCkQRRRcd4l4zO7i+8BiTDN7\r\nbJnwkdPGjuDAzK+nAs58swH484dyKHMwzm8Q/mRpD4+TQpW0INAaNc9Qoim7R3T0\r\n5a+3XtIZPMzkWk2EfC7cQpECAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
      user_keypair_external_id: 'dcd172a1-588e-4a1b-8346-d328e8caf9cf',
    },
  });
}
