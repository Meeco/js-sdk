import { onlyOn } from '@cypress/skip-test';

describe('Cards and Shadows', () => {
  describe('Shadows', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards--shadows');
    });

    it('has a soft shadow card', () => {
      cy.get('.card').eq(0).should('have.css', 'box-shadow', 'rgba(0, 0, 0, 0.16) 0px 2px 8px 0px');
    });

    it('has a hard shadow card', () => {
      cy.get('.card.hard').should('have.css', 'box-shadow', 'rgba(0, 0, 0, 0.24) 0px 4px 16px 0px');
    });

    it('has a dark mode shadow card', () => {
      cy.get('.card.dark').should('have.css', 'box-shadow', 'rgb(0, 0, 0) 0px 4px 16px 0px');
    });
  });

  const includeShadow = settings => {
    return {
      // Account for 16px margin to ensure we snap shadow
      padding: [16, 16],
      clip: {
        x: 0,
        y: 0,
        // Width and height also need to be larger to include padding on both sides
        width: settings.clip.width + 2 * 16,
        height: settings.clip.height + 2 * 16,
      },
    };
  };

  describe('Basic', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards--basic-card');
    });

    onlyOn('Headless', () => {
      it('Basic card matches the snapshot', () => {
        cy.get('.basic').matchImageSnapshot(
          'Basic Card',
          includeShadow({
            clip: {
              width: 217,
              height: 76,
            },
          })
        );
      });
    });
  });

  describe('With Basic Footer', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards--card-with-footer');
    });

    onlyOn('Headless', () => {
      it('Card with footer matches the snapshot', () => {
        cy.get('.card').matchImageSnapshot(
          'Card with Basic Footer',
          includeShadow({
            clip: {
              width: 225,
              height: 119,
            },
          })
        );
      });
    });
  });

  describe('With Complex Footer', () => {
    before(() => {
      cy.visit('/iframe.html?id=cards--card-with-complex-footer');
    });

    onlyOn('Headless', () => {
      it('Card with footer matches the snapshot', () => {
        cy.get('.card').matchImageSnapshot(
          'Card with Complex Footer',
          includeShadow({
            clip: {
              width: 273,
              height: 145,
            },
          })
        );
      });
    });
  });
});
