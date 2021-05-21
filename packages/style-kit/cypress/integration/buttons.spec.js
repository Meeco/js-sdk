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
      foreground: meecoWhite,
      size: {
        width: 146,
        height: 44,
      },
    },
    {
      label: 'Primary Small',
      background: meecoRed,
      foreground: meecoWhite,
      size: {
        width: 126,
        height: 30,
      },
    },
    {
      label: 'Secondary Large',
      background: meecoPink,
      foreground: meecoRed,
      size: {
        width: 168,
        height: 44,
      },
    },
    // {
    //   label: 'Secondary Small',
    //   background: meecoPink,
    //   foreground: meecoRed,
    //   size: {
    //     width: 145,
    //     height: 30,
    //   },
    // },
    {
      label: 'Text Large',
      background: meecoTransparent,
      foreground: meecoRed,
      size: {
        width: 121,
        height: 44,
      },
    },
    {
      label: 'Text Small',
      background: meecoTransparent,
      foreground: meecoRed,
      size: {
        width: 104,
        height: 30,
      },
    },
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
          .matchImageSnapshot(`Buttons: ${button.label}`, {
            clip: {
              x: 0,
              y: 0,
              ...button.size,
            },
          });
      });
    });
  });
});
