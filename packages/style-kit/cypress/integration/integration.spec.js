import { meecoRed, meecoPink, meecoTransparent } from '../fixtures/colors';

describe('Buttons', () => {
  before(() => {
    cy.visit('/iframe.html?id=button--catalog');
  });

  const buttonTypes = [
    {
      label: 'Primary Large',
      background: meecoRed
    },
    {
      label: 'Primary Small',
      background: meecoRed
    },
    {
      label: 'Secondary Large',
      background: meecoPink
    },
    {
      label: 'Secondary Small',
      background: meecoPink
    },
    {
      label: 'Text Large',
      background: meecoTransparent
    },
    {
      label: 'Text Small',
      background: meecoTransparent
    }
  ];
  buttonTypes.forEach(button => {
    it(`${button.label} matches snapshot`, () => {
      cy.get('button')
        .contains(button.label)
        .toMatchImageSnapshot({
          name: `Buttons: ${button.label}`,
          separator: ''
        });
      cy.get('button')
        .contains(button.label)
        .should('have.css', 'background-color', button.background);
    });
  });
});
