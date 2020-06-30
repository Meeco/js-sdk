export default { title: 'Button' };

import 'style-loader!./button.scss';
import '../src/components/icons';

const meecoIcons = () => `<meeco-icon></meeco-icon>`;

const titleWord = word => word.slice(0, 1).toUpperCase() + word.slice(1);
const titleWords = words =>
  words
    .split(' ')
    .map(titleWord)
    .join(' ');

export const catalog = () => {
  const container = document.createElement('div');

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
  const iconButton = document.createElement('button');
  iconButton.className = `icon`;
  iconButton.innerHTML = meecoIcons();
  container.appendChild(iconButton);

  return container;
};
