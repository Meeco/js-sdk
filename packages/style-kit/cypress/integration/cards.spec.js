import { onlyOn } from '@cypress/skip-test';

describe('Cards', () => {
  before(() => {
    cy.visit('/iframe.html?id=cards-and-shadows--cards');
  });

  onlyOn('Headless', () => {
    it('Basic card matches the snapshot', () => {
      cy.get('.basic').matchImageSnapshot('Basic Card');
    });

    it('Complex footer card matches the snapshot', () => {
      cy.get('.complex-footer').matchImageSnapshot('Complex Footer Card');
    });

    it('Bounded card matches the snapshot', () => {
      cy.get('.fixed-width').matchImageSnapshot('Bounded Card');
    });
  });
});
