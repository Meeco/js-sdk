export default { title: 'Controls' };
import { story } from 'style-loader!./controls.stories.scss';

export const toggle = () => /*html*/ `
<div class=${story}>
  <p>Toggle</p>

  <label class="switch-input">
    <input type="checkbox">
    <span class="slider"></span>
  </label>

  <p>Checkbox</p>

  <label class="checkbox-input">
    <input type="checkbox">
    <span class="checkmark"></span>
  </label>

  <p>Radio button</p>

  <label class="radio-button">
    <input type="radio" value="select-me">
    <span class="checkmark"></span>
    <label for="select-me">Select Me</label>
  </label>
</div>`;
