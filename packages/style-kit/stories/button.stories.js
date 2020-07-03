export default { title: 'Button' };

import { story } from 'style-loader!./button.stories.scss';
import '../src/components/icons';

import { titleWords } from './helpers';

const meecoIcons = icon => `<meeco-icon icon=${icon}></meeco-icon>`;

export const catalog = () => {
  const container = document.createElement('div');
  container.className = story;

  const colors = ['primary', 'secondary', 'text'];
  const sizes = ['large', 'small'];
  colors.forEach(color => {
    sizes.forEach(size => {
      const button = document.createElement('button');
      button.className = `${color} ${size}`;
      button.innerHTML = titleWords(`${color} ${size}`);
      container.appendChild(button);
    });
  });

  const types = ['icon', 'icon-only'];
  types.forEach(type => {
    const iconButton = document.createElement('button');
    iconButton.className = `${type}`;
    iconButton.innerHTML =
      type === 'icon-only'
        ? meecoIcons('share')
        : `<span>${meecoIcons('share')}</span> text with icon `;
    container.appendChild(iconButton);
  });

  return container;
};
