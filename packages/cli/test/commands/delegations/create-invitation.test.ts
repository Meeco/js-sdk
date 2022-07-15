import * as sdk from '@meeco/sdk';
import { DelegationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('delegations:create-invitation', () => {
  customTest
    .stub(sdk.mockableFactories, 'keystoreAPIFactory', keystoreAPIFactory as any)
    .stub(sdk.mockableFactories, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .stub(
      DelegationService.prototype,
      'createDelegationInvitation',
      createDelegationInvitation as any
    )
    .run([
      'delegations:create-invitation',
      ...testUserAuth,
      ...testEnvironmentFile,
      'Homer',
      'reader',
    ])
    .it('creates a delegation connection invitation', ctx => {
      const expected = readFileSync(
        outputFixture('delegations-create-invitation.output.yaml'),
        'utf-8'
      );

      console.log(expected);

      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function keystoreAPIFactory(environment) {
  return authConfig => ({
    KeypairApi: {
      keypairsPost: (public_key, encrypted_serialized_key, metadata, external_identifiers) =>
        Promise.resolve({
          keypair: {
            id: '67efb983-5c03-4f6e-be3c-3fa2d255724d',
            public_key:
              '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA4KYXkLZPXLMKKTH/e+Dm\r\nW0jYQPvr16PoDAFPbPTIR2SH7si3qF0MEqRRMLJvLOiIVlTQGCT5sfIqWuJbi9Ds\r\nRkHnbxvA74OdS/2iDFkgxSQpyM0HOjI/73KQDVp6gDhMrPvtlzFeMvBpqcBoMhwv\r\nnm7pHGbvAQELOfZauKgQ3t+mIFnFo7EwAQJKNz5n7vs4UkckOw4CNr07i7QsJAvO\r\n7CQSFiFKMQr0fmOGHNpNmucmlVi0wiP7zB1Ey8l29Coand7GWuzygnmbEQeKXikG\r\n71rAFDLARzbIBlsFRtBsW/knQ2oO1477m3Ir5UKMwYHJmOE9OObWemxuCJ85DlJ3\r\nZ5vcZoqnElr7WdTKIneAo6M2ZXbI+jEVNCWy1v/jnylL3arRUscucRW0wiILZLo1\r\nVf24Y0UTgvpX+fz+atLP38xlYa2o2Gm06D2sHmGi/NxD+uYErByDkhfkJWZZDZDh\r\nmBLkseAfenVKIGc/jhmV8sB4XUv/yUlxuEifwbrbKLs7Qk0Z0PKuCHKKnkGNxsrr\r\nvAFQh6wffoa1kUJ4c3HhsOunLWOl9hEjZHtPxiP4q1/RqxlgsbjQDTGcvyREiGm+\r\nru0+JBXTVj4a3vCY1UvZCupnvzHCr5RT51Hv3Uww1Cu2x3KhgUM+CvAy1NLyFeDz\r\nclgePhg93B+yS8S5uBNCkW0CAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
            encrypted_serialized_key:
              'Aes256Gcm.zzGIecKQYjeD0366GTtYhX1yMYUtHN_7ua9CmErbiZBvMM4HW0TN4jkdGtOahz6t7i_EWa_rYmFd-E13RDw5MU11tPkcsx6c2wuZXA7s3suVYty5teFHpfy0d5KNRlfLrV6TeH0cfRpvAWljcNaXeRpuxIVv3vOEstThMCHzHov7boATJENDBn2_LEU3PVb87Yhequ79A4hcwaIWBqx8ftpye5QjgNxhsLeQjCtpWw9ygMDltT5EDZZEe1-4yvgMMlyFO1DG4s-v7f8A33MTMAiS6vWQgVLmw3TRFSPGfoAwxqkoYPYoAKOzDUj3GinPzwHrM0J0yGyD-wSbXOeVfje6kBMXYItZXD6KzXDTmyYH5PGjQSla4k40m3y3eG7QzcjKWRnyOHMhjD2JpJaRmtUNbiatCC-7BbDcf9-th53lEtfAxVbhSi_eMfWeZhAaH8Q0MlrsjhQ_obFvgb37DkMQAV5MxWTDzd03DkQUEGplfl-ODofRJMzz7CpXhGWsRHma5tdUduo1NbfBvGjfTCkFlCTvcg8bioj_hniaXaEQxWigwRTjPt8NyR2415ZHkFkwZqPQjUgs4yOqO8ZF5Cs6D9pmWYmIfUR4LhJGkeLVi3ol0UAQdo73_5LeUH_oR_8m2ELM46PH-dQUQivJRsUtqsRbipV4XUK1D19eHvg5Fv66tepRZDYlCjMu_xCQXZseaSsuDN1mFWbYcLPzol-Ct8-Z0FvxNiDJCHyxT6637Phj3lj4y3OChyMr_1lzWvCO7anM2lgdxvKhQEn9uGuAsHXRJ_6WYuPQ8Y2XhW4ixMje5LPrA2k98umOyNC5k32hT8bAi96xGjYp2PBVnFcOKRgDaMh-zceFN2cy4RamRB1ttMu9gYppUJphe3qlzhgMhv5gD1ksOKTV057bijr6BhKHf2zy9xdZNIr_ZeicISCZ1sU_zeq50jqw6THGFVAhH_Sm4hXpP5Ng2yevVe0Qls3JgN1ONlBSNqhvOxI5HtRzaMZPGGUNgjNVqItpu1nk83pacEYKlyl9hOxbemvGE61zXJMpeTppOtmrIVL8um-nnE5HKy2gdmTLWVSHrypYcevYRla74Xv2UzH-rp2ofYmyQG5Wogk1NLvzc24hUf2DhpGLyar3AHuBc3NihMzlqr10Uxxqvq_gU9qZlMBminHrV-0sY9mbkMCulaReIav61JJ0dr3enXXFWEkgOfa0s1FdAxFqZcFX72iks093_UQNlLiKgpgb6sXkeDsLC3of8JGM4jHybVQezDmWtTa-a8HzQaE8qxu_MorDm-EIMHKeYH835Ykjhr4lYBDeptHbq18xNwc-LB6-QAuHsP0vkf_JKUKSG6335cGjchQyqWmHqaAL4kL8EykdBDh-E2gpzCKN_jmPhMJBYEskCEgNSwLLRm4tB-5Wi2qeMblrZeLGgxVNqlNNIAUD9gFDEs5KtF7UPn92AsnZ0NWt09mvla-lep3tJRFAO3g2OPh54Ha5xSAY3GGPygLKLyZOwrCPD_QwuC9fv8pZzpeJqtgvG75tk6GZPs6hpz5dB8gi0ZScP600K1iLabrqqlyo3fJQYkjZeLlbOQymZ3eEAUVYzLHjxThGzorf2ZfCYyxmh0yANpu8JWzIhdGEoRX-JMzGzopPi-iX1FDL9lgPPcJl0WohRw1Y7pYpY4X_6vFc7qFxXYFtXE9MiLzZmxIS1qF4WM2iliIFxuPqWca0dQb2BuGzGeheJLMf0PMIo6QAgTP5a1qSbObLF9QRKto5C1pPyIL1AMBwG5QWTTvtIxw2k77SWgLiqN-qyUEq_8he5QOggYTbUXmbrbbyh2M59KhSCkt0aD3vLccYI_CE2_VDFOTIO6t66xXHH565dKem-_98AT-8K2seIYy-VhSHD0e8P-QMg2SfzmWG2v1kRX8VNbYUMV6wJFAYCBMIWErW-JyTwE8f9392wBdXfYUiUlHaDl4N0RolPQULJJQmnggbTXbIB7BFrCmjh0hkzNeySSTpKUuzGh7ATDJ5IasYGRh33lK9Cty8rYil81-OGK2r2-uGGh4Yiv3iTrgK31fAjf1HeLXlrJzFl8gOXojfXiU2hPia1_ytyhKiExV01rij0sRKQNg_txvb4ZJwqhHN0_XKrm-QMyeklF6HvIqVoNKTs8rLW6YzXaPAk2KnqJuwKAMCZ1DAeewp8gVh4cRnX7UfQmR4fXv3Hm1eydgTvIClRNKcuL-7t1QYa-9QqOVqhOQxhzMFqNfhOsEpRopiH4d6b1wiRjBAWibrumMxskPB1yWrKcU5JHJ_nfkytf7vJIBjcZUQQ7sb0VRlIq17y8oYg9K6yLJ0DSDL-amGCq5RtY7dBVxRE9X34cUlmcJaMq1yax4k5P5i7Hki8juHuDv-HsXYvkMan2DokDa3sy2bCUH5G57fy7wF5sBlFAKw5hwMSaMmthSkxQzQXiB-dwwdSPy6M2bC6vbPw3FZcsNia4R5Oz5QtJjJLWtzNVTg7IcVcmauN9OFA_OzATP1JYo4tX6tZLRK1YrxFZP83Ft0YI7RT9oSAxFut6A5AnFcDSboijn8X49f7tjQ3yM1Df6A96HYtkVzl7MUNE9I4dMI0MtPJaduALuJtglb3S1NWkOWlRAt9cHBnb7CCrEuaYMmV5QCTAKsPyQPlicilm5OyBBAMyGdZwNFJ3hgH5DmStEfc7BsGqoGaQPOw1A2x-w46kvlpiYqTVYimgIsU7swxyy0HRsdMZ1dZPAPEvPcEJN07UgsPDmE2SFWh_8oX1PJwfCTbEepEXQ9ax6oTBKpiTThPkMC11TBjftlnKXoq9TqK0lV7fiwTOlhIhEyM-ojzBcENQhe8piNj8tJw9m8ifnFxSZ2nXW7ITxbzTw5NpiuJG9jLRQkNqZUyQPToCYU52-XeSy1-fzmhm9ScymghOOnRdHwzOXX1MXxkn29OY-OJGulbabiO_qRtSor_tbOrkyTiPILhXDHzfW5-HobOC1UAVvsE9GKdsdB4_yO6JH9L3G1-Y4wgLRAyGx03_O3ZJFv3PaZjd0GgRczcSJzRgAjyR9IHFPq62A0kbGePY5H6SKN52KCoBOCsNbHKN0WIp0O8Pc1RuZGfTyS0a7dGyFP63kagctJQ4iTeZGoTKsx-XTs_hAxgSxKBqYAbdO4UvrdDuJTP59CsYx-ziQLiSJBZJfdOXZoD2UZ4D8BrTDKyJvVOWKEWmBMScKK79H70wEAtV_tboRyrfX95qC71AtllUSpKj94RjMHrziEaASlmvJ6dGlya9XHyF9ygGAJqhiexAF-pz8RYUGM7ITCdiuH-pqmP5tR6DV2TQtsFF51BgjmfG2rV4QnymAGOdxR4xQiMaZ8VuQ7e_QV58RF3FwArwNzhOaE3_Q1nnqAG2XZgB8-X-iD2oW7jQ9XHl-QJ2FY3a9RvoZaOWNG6erNxNzTftfJ1Ke1nymG9JvGGkLBhojB2M5gcP-zpAA71_dLhNzcJh-2Wk-NEZxR3htgoAJg8WpkmxjqQFbwEqj9VDQDDsU0CU_A1r49Uounb03z0V-gaxdChsBrodZR1XEitFsBJL6bT3CQiPwbmzKEF9GpGrKjAreSIKsUdKsHZ4ZgTAHJIlqGAbA41pEat5wlE0cMl64MP1fUBPx3bluUeVlwyRaTo-fPb2jdZVUHrSCIJLx2b1d3LOW5crMQwn58jFa6pb4yxHMjBc2TCEbWhUPwKjBUR8jXC65u-uPru9aKlQ9VV6GJIyXspJqNKFNIT4qH72h6Sm_Y-jdmHa7mfF9j8Jk_0kagL_u-aXFUjojqJjnyL_SjsQVEDZaYWlmetQvEA-MoZn36iQeTqCFpY0zEd_UchNJ_Moy7sQwqC53Yzs2xexfLGa09FAOXP35z_54uNcrMY0sG5PsIcymtgBOQ8BGJ305MpO-w5RnuvJ2uEnr_kdiDiSxPZZKKXwAnQj3Pyt1OhftnYHb6J2FlBwsmMDxy_53UIFDgKuvsQSNebP_T3shgFn0TKqVq6IwfGtVJzlnP1N-FICVMfrudEthwLCSkydneRb704i8mld5xj4fCHFTuwAZftFzomOjqO3fjOx-HGaoTHBa6nknLEdMxqnMqSOEjs9R0phNxtnk4K4BMuGJ66xrvfBZ-PNLHb1gy537D1aP805DeQKbK9rqpVezhIj3O3RzyL_ByKgeQoU0kDhRWzI1NBvyfD709-U5_OaqQjVqY8odlYnNTv-mMn21iN5G9DNIrPmidgZjLU0-Q81773jSDfhN1KYQh5mBvEYRGDJmo7t0ni38tLwoNNcmGNVb_O6llvryvHhV7NFBsMSdj7BpNnaSiyUGhSsY-dX1-dMlE_Z-GuJ8YvlVsLHvrupCumEUepTum2XjH1fm01lkIQOUC2plMSQ==.QUAAAAAFaXYADAAAAAAXebcNi-GhCUaD0IUFYXQAEAAAAAB2eUt53SoPtHfPdIQ3BzXlAmFkAAUAAABub25lAAA=',
            metadata: {},
            external_identifiers: [],
          },
        }),
    },
  });
}

function vaultAPIFactory(environment) {
  return authConfig => ({
    UserApi: {
      meGet: () =>
        Promise.resolve({
          user: {
            id: 'e9dab432-7e3a-4811-aa69-c4c3c52ffa39',
            full_name: null,
            email: '',
            country: null,
            joined_at: null,
            onboarded_at: null,
            track_events: true,
            track_usage: true,
            timezone: null,
            private_dek_external_id: '015de7f9-c544-4e47-8521-cc07ef498450',
            queued_for_deletion_after: null,
            accepted_terms: false,
          },
        }),
    },
  });
}

function createDelegationInvitation(
  authConfig,
  userId,
  delegation_role,
  recipient_name,
  keypairId
) {
  return Promise.resolve({
    id: '8481aad1-2961-4530-90bf-b1557cc4c246',
    message: null,
    sent_at: null,
    invited_user_id: null,
    token: 'V_PVzZjXRwAKWHyAIEmnzNeBd1Ak44q-NcbDHDXm6Cc',
    outgoing: true,
    user_name: 'Anonymous User',
    keypair_external_id: '9e78a843-a37d-456a-a01e-5867fd709db8',
    encrypted_recipient_name:
      'Aes256Gcm.AQ-b6Ts=.QUAAAAAFaXYADAAAAAC6NQnnUH6ZNC4ghlQFYXQAEAAAAABi5VogadDhulQ2PolCmBngAmFkAAUAAABub25lAAA=',
    integration_data: {
      intent: 'delegate',
      role: 'reader',
      delegation_token: '7aa22b5d-0413-41e2-9cdc-47e11c2b3540',
    },
    expire_at: '2021-07-27T05:31:32.795Z',
    shares_to_be_created: 0,
  });
}
