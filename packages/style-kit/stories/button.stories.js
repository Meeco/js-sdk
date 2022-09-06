import mdx from './button.mdx';
import styles from 'style-loader!./button.stories.scss';
import { titleWords } from './helpers';

export default {
  title: 'Button',
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export const primaryButton = () => /*html*/ `
  <div class=${styles.story} style='height:140px;'>
    <button class="primary large">Primary Large</button>
    <button class="primary small">Primary Small</button>
  </div>`;

export const secondaryButton = () => /*html*/ `
  <div class=${styles.story}>
    <button class="secondary large">Secondary Large</button>
    <button class="secondary small">Secondary Small</button>
  </div>`;

export const textButton = () => /*html*/ `
  <div class=${styles.story}>
    <button class="text large">Text Large</button>
    <button class="text small">Text Small</button>
  </div>`;

export const iconButton = () => /*html*/ `
<div class=${styles.story}>
  <button class="text"><i>duplicate</i>Text with icon</button>
  <button class="icon-only"><i>share</i></button>
</div>`;

export const catalog = () => {
  const container = document.createElement('div');
  container.className = styles.story;

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
