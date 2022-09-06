import mdx from './card.mdx';
import styles from 'style-loader!./card.stories.scss';

export default {
  title: 'Cards',
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export const shadows = () => /*html*/ `
<div class="${styles.story} shadows">
  <p>Soft Shadow (Default for Cards)</p>
  <div class="card"></div>
  <p>Hard Shadow</p>
  <div class="card hard"></div>
  <p>Dark Mode Shadow</p>
  <div class="card dark"></div>
</div>
`;

export const basicCard = ({ title, subtitle }) => {
  return /*html*/ `

  <div class="${styles.story} advanced">
    <p>Basic Card</p>
    <div class="card basic">
      <div class="content">
        <div class="icon"></div>
        <div>
          <p class="card-label">${title}</p>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
      </div>
    </div>
  </div>`;
};

basicCard.args = {
  title: 'Basic Card',
  subtitle: 'Sub-label (Optional)',
};

export const cardWithFooter = ({ footer }) => {
  return /*html*/ `
    <div class="${styles.story} advanced">
      <p>Card with a Footer</p>
      <div class="card">
        <div class="content">
          <div class="icon"></div>
          <p class="card-label">Default Card Label</p>
        </div>
        <div class="footer">
          <p class="subtitle">${footer}</p>
        </div>
      </div>
    </div>`;
};

cardWithFooter.args = {
  footer: 'Some Footer Text',
};

export const cardWithComplexFooter = () => /*html*/ `
    <div class="${styles.story} advanced">
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
<div class=${styles.story}>
  <div class="tile">
    <div class="content">
      <div class="icon"></div>
      <p class="tile-label">Tile label</p>
      <span class="tag">Optional Tag</span>
    </div>
  </div>
</div>
`;
