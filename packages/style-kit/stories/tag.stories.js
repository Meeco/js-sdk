export default { title: 'Tags' };
import { story } from 'style-loader!./tag.stories.scss';

export const tags = () =>
  // Replace meeco-icon with icon font
  /*html*/
  `<div class="${story}">
    <span class="tag">Tag name</span>
      <span class="tag-edit">
        Tag edit mode<meeco-icon icon="close"></meeco-icon>
      </span>
      <span class="tag-icon">
        <meeco-icon icon="contactNew"></meeco-icon>
        Tag with Icon
      </span>
  </div>`;
