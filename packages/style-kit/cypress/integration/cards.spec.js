import { onlyOn } from '@cypress/skip-test';

describe('Cards and Shadows', () => {
  describe('Cards', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards--shadows');
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
      cy.visit('/iframe.html?id=cards--basic-card');
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
    });
  });

  describe('Cards', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards--card-with-footer');
    });
    onlyOn('Headless', () => {
      it('Card with footer matches the snapshot', () => {
        cy.get('.card').matchImageSnapshot('Card with footer', {
          clip: {
            x: 0,
            y: 0,
            width: 216,
            height: 76
          }
        });
      });
    });
  });
});
