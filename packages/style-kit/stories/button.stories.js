export default { title: 'Button' };

import 'style-loader!./button.scss';
import '../src/components/icons';

const meecoIcons = icon => `<meeco-icon icon=${icon}></meeco-icon>`;

const titleWord = word => word.slice(0, 1).toUpperCase() + word.slice(1);
const titleWords = words =>
  words
    .split(' ')
    .map(titleWord)
    .join(' ');

export const catalog = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.width = '240px';

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
  const icons = ['share', null];
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
