import { meecoCharcoal, meecoCharcoalShade } from '../fixtures/colors';

describe('Typography', () => {
  before(() => {
    cy.visit('/iframe.html?id=typography--typographic-styles');
  });

  it('has the correct headings', () => {
    const medium = '500';
    const bold = '700';
    const normal = '400';

    cy.contains('Heading 1').should('have.css', 'font-size', '50px');
    cy.contains('Heading 1').should('have.css', 'font-weight', medium);
    cy.contains('Heading 1').should('have.css', 'color', meecoCharcoal);

    cy.contains('Heading 2').should('have.css', 'font-size', '32px');
    cy.contains('Heading 2').should('have.css', 'font-weight', medium);
    cy.contains('Heading 2').should('have.css', 'color', meecoCharcoal);

    cy.contains('Heading 3').should('have.css', 'font-size', '24px');
    cy.contains('Heading 3').should('have.css', 'font-weight', medium);
    cy.contains('Heading 3').should('have.css', 'color', meecoCharcoal);

    cy.contains('Heading 4').should('have.css', 'font-size', '20px');
    cy.contains('Heading 4').should('have.css', 'font-weight', medium);
    cy.contains('Heading 4').should('have.css', 'color', meecoCharcoal);

    cy.contains('Heading 5').should('have.css', 'font-size', '18px');
    cy.contains('Heading 5').should('have.css', 'font-weight', medium);
    cy.contains('Heading 5').should('have.css', 'color', meecoCharcoal);

    cy.contains('Heading 6').should('have.css', 'font-size', '16px');
    cy.contains('Heading 6').should('have.css', 'font-weight', bold);
    cy.contains('Heading 6').should('have.css', 'color', meecoCharcoal);

    cy.contains('Body Text Large').should('have.css', 'font-size', '18px');
    cy.contains('Body Text Large').should('have.css', 'font-weight', normal);
    cy.contains('Body Text Large').should('have.css', 'color', meecoCharcoal);

    cy.contains('Body Text Medium').should('have.css', 'font-size', '16px');
    cy.contains('Body Text Medium').should('have.css', 'font-weight', normal);
    cy.contains('Body Text Medium').should('have.css', 'color', meecoCharcoal);

    cy.contains('Body Text Small').should('have.css', 'font-size', '14px');
    cy.contains('Body Text Small').should('have.css', 'font-weight', normal);
    cy.contains('Body Text Small').should('have.css', 'color', meecoCharcoal);

    cy.contains('Card Name Label').should('have.css', 'font-size', '16px');
    cy.contains('Card Name Label').should('have.css', 'font-weight', medium);
    cy.contains('Card Name Label').should('have.css', 'color', meecoCharcoal);

    cy.contains('Text Field Label').should('have.css', 'font-size', '16px');
    cy.contains('Text Field Label').should('have.css', 'font-weight', normal);
    cy.contains('Text Field Label').should('have.css', 'color', meecoCharcoal);

    cy.get('input').should('have.css', 'font-size', '18px');
    cy.get('input').should('have.css', 'font-weight', medium);
    cy.get('input').should('have.css', 'color', meecoCharcoal);
  });
});
