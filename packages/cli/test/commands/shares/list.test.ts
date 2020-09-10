// import { expect } from '@oclif/test';
// import { readFileSync } from 'fs';
// import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

// describe('shares:list', () => {
//   customTest
//     .stdout()
//     .stderr()
//     .nock('https://sandbox.meeco.me/vault', api => {
//       api
//         .get('/shares/incoming')
//         .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
//         .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//         .reply(200, {
//           shares: [
//             {
//               id: 'sh_1',
//               connection_id: 'con_1',
//               shareable_id: 'it_1',
//             },
//             {
//               id: 'sh_2',
//               connection_id: 'con_1',
//               shareable_id: 'it_3',
//             },
//             {
//               id: 'sh_3',
//               connection_id: 'con_2',
//               shareable_id: 'it_2',
//             },
//           ],
//         });
//     })
//     .run(['shares:list', ...testUserAuth, ...testEnvironmentFile])
//     .it('shows a list of shared items (to and from the user)', ctx => {
//       const expected = readFileSync(outputFixture('list-shares.output.yaml'), 'utf-8');
//       expect(ctx.stdout).to.contain(expected);
//     });
// });
