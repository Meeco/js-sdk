import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('templates:list', () => {
  customTest
    .stderr()
    .stdout()
    .nock('https://api-sandbox.meeco.me', api => {
      api
        .get('/item_templates')
        .query({
          'by_classification[scheme]': 'esafe',
          'by_classification[name]': 'esafe_templates'
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .reply(200, response);
    })
    .run(['templates:list', ...testUserAuth, ...testEnvironmentFile])
    .it('fetches a list of available templates', ctx => {
      const expected = readFileSync(outputFixture('list-templates.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const response = {
  item_templates: [
    {
      name: 'food',
      slots_ids: ['steak', 'pizza', 'yoghurt']
    },
    {
      name: 'drink',
      slot_ids: ['yoghurt', 'water', 'beer']
    },
    {
      name: 'activities',
      slot_ids: ['sport', 'recreational']
    }
  ],
  slots: []
};
