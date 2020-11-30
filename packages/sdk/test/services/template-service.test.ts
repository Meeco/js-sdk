import { SlotType, TemplateService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { reportIfTruncated } from '../../src/util/paged';
import {
  DEFAULT_CLASSIFICATION_NAME,
  DEFAULT_CLASSIFICATION_SCHEME,
  MOCK_NEXT_PAGE_AFTER,
} from '../constants';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('TemplateService', () => {
  const response = {
    item_templates: [
      {
        created_at: new Date(1),
        updated_at: new Date(1),
        name: 'food',
        slots_ids: ['steak', 'pizza', 'yoghurt'],
      },
      {
        id: 'drink_id',
        created_at: new Date(1),
        updated_at: new Date(1),
        name: 'drink',
        slot_ids: ['yoghurt', 'water', 'beer'],
      },
    ],
    slots: ['pizza', 'steak', 'yoghurt', 'water', 'beer'].map(x => ({
      id: x,
      created_at: new Date(1),
      updated_at: new Date(1),
      slot_type_name: SlotType.KeyValue,
    })),
    attachments: [],
    thumbnails: [],
    classification_nodes: [],
    meta: [],
  };

  describe('#get', () => {
    const id = '123';
    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get(`/item_templates/${id}`)
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, {
            item_template: {},
            slots: [],
            classification_nodes: [],
            attachments: [],
            thumbnails: [],
          });
      })
      .do(() => new TemplateService(environment).get(testUserAuth, id))
      .it('calls GET /item_templates/id');
  });

  describe('#list', () => {
    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, response);
      })
      .do(() => new TemplateService(environment).list(testUserAuth))
      .it('calls GET /item_templates');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .query({
            'by_classification[scheme]': DEFAULT_CLASSIFICATION_SCHEME,
            'by_classification[name]': DEFAULT_CLASSIFICATION_NAME,
          })
          .reply(200, response);
      })
      .do(() =>
        new TemplateService(environment).list(testUserAuth, {
          classificationScheme: DEFAULT_CLASSIFICATION_SCHEME,
          classificationName: DEFAULT_CLASSIFICATION_NAME,
        })
      )
      .it('fetches a list of available templates scoped to classification scheme and name');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .query({
            like: 'fake_label',
          })
          .reply(200, response);
      })
      .do(() =>
        new TemplateService(environment).list(testUserAuth, {
          like: 'fake_label',
        })
      )
      .it('fetches a list of available templates searching by label');
  });

  describe('#listAll', () => {
    const responsePart1 = {
      ...response,
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
      ...response,
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

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .once()
          .reply(200, responsePart1)
          .get('/item_templates')
          .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
          .reply(200, responsePart2);
      })
      .add('result', () => new TemplateService(environment).listAll(testUserAuth))
      .add('expected', () => getOutputFixture('list-templates.output.json'))
      .it('fetches all templates when paginated', async ({ result, expected }) => {
        reportIfTruncated(console.log);

        const requiredTemplateNames = result.item_templates.map(x => x.name);
        expect(requiredTemplateNames).to.members(expected);
      });
  });

  describe('#findByName', () => {
    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .once()
          .reply(200, response);

        api.get('/item_templates/drink_id').reply(200, {
          ...response,
          item_template: response.item_templates[1],
        });
      })
      .add('result', () => new TemplateService(environment).findByName(testUserAuth, 'drink'))
      .it('searches by name', ({ result }) => {
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.not.be.undefined;
        expect(result!.name).to.equal('drink');
      });

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .once()
          .reply(200, {
            ...response,
            item_templates: [response.item_templates[0]],
            next_page_after: MOCK_NEXT_PAGE_AFTER,
            meta: [{ next_page_exists: true }],
          });

        api
          .get('/item_templates')
          .query({
            next_page_after: MOCK_NEXT_PAGE_AFTER,
          })
          .once()
          .reply(200, {
            ...response,
            item_templates: [response.item_templates[1]],
            meta: [],
          });

        api.get('/item_templates/drink_id').reply(200, {
          ...response,
          item_template: response.item_templates[1],
        });
      })
      .add('result', () => new TemplateService(environment).findByName(testUserAuth, 'drink'))
      .it('works when paged', ({ result }) => {
        expect(result?.name).to.equal('drink');
      });

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/item_templates')
          .query({
            'by_classification[scheme]': DEFAULT_CLASSIFICATION_SCHEME,
            'by_classification[name]': DEFAULT_CLASSIFICATION_NAME,
            like: '123',
          })
          .once()
          .reply(200, response);
      })
      .do(() =>
        new TemplateService(environment).findByName(testUserAuth, '', {
          classificationName: DEFAULT_CLASSIFICATION_NAME,
          classificationScheme: DEFAULT_CLASSIFICATION_SCHEME,
          like: '123',
        })
      )
      .it('applies other filters');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get('/item_templates').reply(200, response);
      })
      .add('result', () => new TemplateService(environment).findByName(testUserAuth, ''))
      .it('returns undefined when no template is found', ({ result }) => {
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.undefined;
      });
  });
});
