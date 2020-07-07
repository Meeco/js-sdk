import { onlyOn } from '@cypress/skip-test';

describe('Colors', () => {
  before(() => {
    cy.visit('/iframe.html?id=colors--color-palette');
  });

  // Snapshot testing is currently not very workable between headed and headless versions of cpres
  // https://github.com/cypress-io/cypress/issues/3324
  // https://github.com/cypress-io/cypress/issues/2102
  onlyOn('headless', () => {
    it('has the correct color palette', () => {
      cy.get('.main').matchImageSnapshot('Color Palette');
    });
  });
});
