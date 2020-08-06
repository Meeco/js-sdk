import mdx from './tag.mdx';
import { story } from 'style-loader!./tag.stories.scss';
export default { title: 'Tags', parameters: { docs: { page: mdx } } };

export const tag = () => /*html*/ `
<div class=${story}>
  <span class="tag">Category</span>
</div>
  `;

export const tagIcon = () => /*html*/ `
<div class=${story}>
  <span class="tag-icon"><i>verified-reverse</i>Verified</span>
</div>`;

export const tags = () =>
  /*html*/
  `<div class="${story}">
    <span class="tag">Tag name</span>
      <span class="tag-edit">
        Tag edit mode <i>cross</i>
      </span>
      <span class="tag-icon">
        <i>verified-reverse</i>
        Tag with Icon
      </span>
  </div>`;
