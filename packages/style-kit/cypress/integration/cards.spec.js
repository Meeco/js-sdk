import { onlyOn } from '@cypress/skip-test';

describe('Cards and Shadows', () => {
  describe('Cards', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards-and-shadows--shadows');
    });

    it('has a soft shadow card', () => {
      cy.get('.card')
        .eq(0)
        .should('have.css', 'box-shadow', 'rgba(0, 0, 0, 0.16) 0px 2px 8px 0px');
    });

    it('has a hard shadow card', () => {
      cy.get('.card.hard').should('have.css', 'box-shadow', 'rgba(0, 0, 0, 0.24) 0px 4px 16px 0px');
    });

    it('has a dark mode shadow card', () => {
      cy.get('.card.dark').should('have.css', 'box-shadow', 'rgb(0, 0, 0) 0px 4px 16px 0px');
    });
  });

  describe('Cards', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards-and-shadows--cards');
    });
    onlyOn('Headless', () => {
      it('Basic card matches the snapshot', () => {
        cy.get('.basic').matchImageSnapshot('Basic Card', {
          clip: {
            x: 0,
            y: 0,
            width: 216,
            height: 76
          }
        });
      });

      it('Complex footer card matches the snapshot', () => {
        cy.get('.complex-footer').matchImageSnapshot('Complex Footer Card', {
          clip: {
            x: 0,
            y: 0,
            width: 268,
            height: 145
          }
        });
      });

      it('Bounded card matches the snapshot', () => {
        cy.get('.fixed-width .card').matchImageSnapshot('Bounded Card', {
          // Because of font rendering differences in headless docker
          // we bump this up a bit
          failureThreshold: 0.15,
          failureThresholdType: 'percent',
          clip: {
            x: 0,
            y: 0,
            width: 328,
            height: 169
          }
        });
      });
    });
  });
});
