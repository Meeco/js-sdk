import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  DEFAULT_CLASSIFICATION_NAME,
  DEFAULT_CLASSIFICATION_SCHEME
} from '../../../src/util/constants';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('templates:list', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
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
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
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
      background_color: null
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
      slot_ids: [
        'yoghurt',
        'water',
        'beer'
      ],
      label: null,
      background_color: null
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
      slot_ids: [
        'sport',
        'recreational'
      ],
      label: null,
      background_color: null
    }
  ],
  meta: null
};

function vaultAPIFactory(environment) {
  return (authConfig) => ({
    ItemTemplateApi: {
      itemTemplatesGet: (classificationScheme, classificationName) => Promise.resolve(templates)
    }
  });
}
