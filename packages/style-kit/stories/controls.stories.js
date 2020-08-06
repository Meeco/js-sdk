import mdx from './controls.mdx';

import { story } from 'style-loader!./controls.stories.scss';

export default {
  title: 'Controls',
  parameters: {
    docs: {
      page: mdx
    }
  }
};

export const toggle = () => /*html*/ `
<div class=${story}>
  <p>Toggle</p>

  <label class="switch-input">
    <input type="checkbox">
    <span class="slider"></span>
  </label>
</div>`;

export const checkbox = () => /*html*/ `
<div class=${story}>
  <p>Checkbox</p>

  <label class="checkbox-input">
    <input type="checkbox">
    <span class="checkmark"></span>
  </label>
</div>`;

export const radioButton = () => /*html*/ `
<div class=${story}>
  <p>Radio button</p>

  <label class="radio-button">
    <input type="radio" value="select-me">
    <span class="checkmark"></span>
    <label for="select-me">Select Me</label>
  </label>
</div>`;
