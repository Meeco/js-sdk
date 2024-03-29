import { onlyOn } from '@cypress/skip-test';

describe.skip('Colors', () => {
  before(() => {
    cy.visit('/iframe.html?id=colors--color-palette');
  });

  // Snapshot testing is currently not very workable between headed and headless versions of cpres
  // https://github.com/cypress-io/cypress/issues/3324
  // https://github.com/cypress-io/cypress/issues/2102
  onlyOn('headless', () => {
    it('has the correct color palette', () => {
      cy.get('.main').matchImageSnapshot('Color Palette', {
        // Sizing may be off but would take a whole color to be wrong to break.
        failureThreshold: 5,
        failureThresholdType: 'percent',
        clip: {
          x: 0,
          y: 0,
          width: 1270,
          height: 924,
        },
      });
    });
  });
});
