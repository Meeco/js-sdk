export default { title: 'Tags' };
import { story } from 'style-loader!./tag.stories.scss';

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
