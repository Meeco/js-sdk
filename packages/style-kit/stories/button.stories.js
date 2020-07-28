export default { title: 'Button' };

import { story } from 'style-loader!./button.stories.scss';

import { titleWords } from './helpers';

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

  const iconButtons = document.createElement('div');
  iconButtons.innerHTML = `
  <button class="text"><i>share</i>text with icon</button>
  <button class="icon-only"><i>add</i></button>`;
  container.appendChild(iconButtons);

  return container;
};
