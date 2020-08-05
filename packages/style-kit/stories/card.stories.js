import mdx from './card.mdx';
import { story } from 'style-loader!./card.stories.scss';
import { withKnobs, text } from '@storybook/addon-knobs';

export default {
  title: 'Cards',
  decorators: [withKnobs],
  parameters: {
    docs: {
      page: mdx
    }
  }
};

export const shadows = () => /*html*/ `
<div class="${story} shadows">
  <p>Soft Shadow (Default for Cards)</p>
  <div class="card"></div>
  <p>Hard Shadow</p>
  <div class="card hard"></div>
  <p>Dark Mode Shadow</p>
  <div class="card dark"></div>
</div>
`;

export const basicCard = () => /*html*/ `
  <div class="${story} advanced">
    <p>Basic Card</p>
    <div class="card basic">
      <div class="content">
        <div class="icon"></div>
        <div>
          <p class="card-label">Basic Card Label</p>
          <p class="subtitle">card subtitle</p>
        </div>
      </div>
    </div>
  </div>`;

export const cardWithFooter = () => /*html*/ `
    <div class="${story} advanced">
      <p>Card with a Footer</p>
      <div class="card">
        <div class="content">
          <div class="icon"></div>
          <p class="card-label">Default Card Label</p>
        </div>
        <div class="footer">
          <p class="subtitle">Footer subtitle</p>
        </div>
      </div>
    </div>`;

export const cardWithComplexFooter = () => /*html*/ `
    <div class="${story} advanced">
      <p>Complex Footers</p>
      <div class="card complex-footer">
        <div class="content">
          <div class="icon"></div>
          <div>
            <p class="card-label">Example Complex Footer</p>
          </div>
        </div>
        <div class="footer">
          <p class="subtitle">Label</p>
          <div>
            <p>More Text</p>
            <div class="icon"></div>
          </div>
        </div>
      </div>
    </div>`;

export const tile = () => /*html*/ `
<div class=${story}>
  <div class="tile">
    <div class="content">
      <div class="icon"></div>
      <p class="tile-label">Tile label</p>
      <span class="tag">Optional Tag</span>
    </div>
  </div>
</div>
`;
