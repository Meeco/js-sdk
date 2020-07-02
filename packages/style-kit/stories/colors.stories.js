export default { title: 'Colors' };

import 'style-loader!./colors.stories.scss';

import { titleWords } from './helpers';

const colors = [
  'red',
  'blue',
  'charcoal',
  'smoke',
  'orange',
  'yellow',
  'lime',
  'green',
  'mint',
  'dark-blue',
  'purple',
  'violet',
  'fuchsia',
  'pink',
  'ocean-blue',
  'forest-green'
];

const variants = ['shade', 'tint50', 'tint10'];

export const colorPalette = () => {
  const allColors = document.createElement('div');
  allColors.className = 'colors';
  colors.forEach(color => {
    const container = document.createElement('div');
    container.className = 'color-container';
    const label = document.createElement('p');
    label.innerHTML = titleWords(color);
    container.appendChild(label);
    const base = document.createElement('div');
    base.className = `${color} base`;
    container.appendChild(base);

    variants.forEach(variantName => {
      const variant = document.createElement('div');
      variant.className = `${color}_${variantName} variant`;
      container.appendChild(variant);
    });

    allColors.appendChild(container);
  });
  return allColors;
};
