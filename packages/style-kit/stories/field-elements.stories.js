export default { title: 'Field Elements' };

import 'style-loader!./field-elements.stories.scss';
import '../src/components/icons';

const meecoIcons = icon => `<meeco-icon icon=${icon}></meeco-icon>`;

export const inputs = () => {
  const container = document.createElement('div');

  const types = ['', 'Text Value', 'With Label'];

  types.forEach(type => {
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = type;

    if (inputField.placeholder === 'With Label') {
      const inputLabel = document.createElement('div');
      const label = document.createElement('label');
      label.innerHTML = 'Label';
      inputLabel.appendChild(label);
      inputLabel.appendChild(inputField);
      container.appendChild(inputLabel);
    } else {
      container.appendChild(inputField);
    }
  });

  const searchBar = document.createElement('div');
  searchBar.className = 'search-bar';
  searchBar.innerHTML = meecoIcons('search');
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'search';
  searchBar.appendChild(input);
  container.appendChild(searchBar);

  return container;
};
