import { meecoRed, meecoPink, meecoTransparent, meecoWhite } from '../fixtures/colors';
import { onlyOn } from '@cypress/skip-test';

describe('Buttons', () => {
  before(() => {
    cy.visit('/iframe.html?id=button--catalog');
  });

  const buttonTypes = [
    {
      label: 'Primary Large',
      background: meecoRed,
      foreground: meecoWhite
    },
    {
      label: 'Primary Small',
      background: meecoRed,
      foreground: meecoWhite
    },
    {
      label: 'Secondary Large',
      background: meecoPink,
      foreground: meecoRed
    },
    {
      label: 'Secondary Small',
      background: meecoPink,
      foreground: meecoRed
    },
    {
      label: 'Text Large',
      background: meecoTransparent,
      foreground: meecoRed
    },
    {
      label: 'Text Small',
      background: meecoTransparent,
      foreground: meecoRed
    }
  ];

  buttonTypes.forEach(button => {
    it(`${button.label} matches styles`, () => {
      cy.get('button')
        .contains(button.label)
        .should('have.css', 'background-color', button.background);
      cy.get('button')
        .contains(button.label)
        .should('have.css', 'color', button.foreground);
    });

    // Snapshot testing is currently not very workable between headed and headless versions of cpres
    // https://github.com/cypress-io/cypress/issues/3324
    // https://github.com/cypress-io/cypress/issues/2102
    onlyOn('headless', () => {
      it(`${button.label} matches snapshot`, () => {
        cy.get('button')
          .contains(button.label)
          .matchImageSnapshot(`Buttons: ${button.label}`);
      });
    });
  });
});
