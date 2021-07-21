import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  DEFAULT_CLASSIFICATION_NAME,
  DEFAULT_CLASSIFICATION_SCHEME,
} from '../../../src/util/constants';
import {
  customTest,
  MOCK_NEXT_PAGE_AFTER,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

describe('templates:list', () => {
  customTest
    .stub(sdk.mockableFactories, 'vaultAPIFactory', vaultAPIFactory as any)
    .stderr()
    .stdout()
    .run(['templates:list', ...testUserAuth, ...testEnvironmentFile])
    .it(
      'fetches a list of available templates (no classification scheme or name provided)',
      ctx => {
        const expected = readFileSync(outputFixture('list-templates.output.yaml'), 'utf-8');
        expect(ctx.stdout).to.contain(expected);
      }
    );

  customTest
    .stub(sdk.mockableFactories, 'vaultAPIFactory', vaultAPIFactory as any)
    .stderr()
    .stdout()
    .run([
      'templates:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-s',
      DEFAULT_CLASSIFICATION_SCHEME,
      '-n',
      DEFAULT_CLASSIFICATION_NAME,
    ])
    .it('fetches a list of available templates scoped to classification scheme and name', ctx => {
      const expected = readFileSync(outputFixture('list-templates.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stderr()
    .stdout()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .query({
          like: DEFAULT_CLASSIFICATION_NAME,
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, templates);
    })
    .run([
      'templates:list',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-l',
      DEFAULT_CLASSIFICATION_NAME,
    ])
    .it('fetches a list of available templates searching by label', ctx => {
      const expected = readFileSync(outputFixture('list-templates.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stderr()
    .stdout()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/item_templates')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2);
    })
    .run(['templates:list', ...testUserAuth, ...testEnvironmentFile, ...testGetAll])
    .it('fetches all templates when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-templates.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const templates = {
  next_page_after: null,
  attachments: [],
  thumbnails: [],
  classification_nodes: [],
  slots: [],
  item_templates: [
    {
      id: null,
      name: 'food',
      description: null,
      ordinal: null,
      visible: null,
      user_id: null,
      updated_at: null,
      image: null,
      template_type: null,
      classification_node_ids: null,
      slot_ids: null,
      label: null,
      background_color: null,
    },
    {
      id: null,
      name: 'drink',
      description: null,
      ordinal: null,
      visible: null,
      user_id: null,
      updated_at: null,
      image: null,
      template_type: null,
      classification_node_ids: null,
      slot_ids: ['yoghurt', 'water', 'beer'],
      label: null,
      background_color: null,
    },
    {
      id: null,
      name: 'activities',
      description: null,
      ordinal: null,
      visible: null,
      user_id: null,
      updated_at: null,
      image: null,
      template_type: null,
      classification_node_ids: null,
      slot_ids: ['sport', 'recreational'],
      label: null,
      background_color: null,
    },
  ],
  meta: [],
};

const responsePart1 = {
  ...templates,
  item_templates: [
    {
      name: 'food',
      slots_ids: ['steak', 'pizza', 'yoghurt'],
    },
    {
      name: 'drink',
      slot_ids: ['yoghurt', 'water', 'beer'],
    },
  ],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: [
    {
      next_page_exists: true,
    },
  ],
};

const responsePart2 = {
  ...templates,
  item_templates: [
    {
      name: 'activities',
      slot_ids: ['sport', 'recreational'],
    },
  ],
  meta: [
    {
      next_page_exists: false,
    },
  ],
};

function vaultAPIFactory(environment) {
  return authConfig => ({
    ItemTemplateApi: {
      itemTemplatesGet: (classificationScheme, classificationName) => Promise.resolve(templates),
    },
  });
}
