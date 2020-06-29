export default { title: 'Button' };

import 'style-loader!./button.scss';

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

  return container;
};
