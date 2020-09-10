export default { title: 'Colors' };

import { story } from 'style-loader!./colors.stories.scss';

import { titleWords } from './helpers';

const primary = ['red', 'blue', 'charcoal', 'smoke'];

const secondary = [
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
  'forest-green',
];

const variants = ['shade', 'tint50', 'tint10'];

export const colorPalette = () => {
  const allColors = document.createElement('div');
  allColors.className = story + ' main';
  const buildPalette = color => {
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
  };

  const addHeading = heading => {
    const subHeading = document.createElement('h4');
    subHeading.innerHTML = heading;
    allColors.appendChild(subHeading);
  };

  addHeading('Primary Colors');
  primary.forEach(buildPalette);

  addHeading('Secondary Colors');
  secondary.forEach(buildPalette);

  return allColors;
};
