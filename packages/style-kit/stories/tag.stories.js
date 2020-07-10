export default { title: 'Tags' };
import { story } from 'style-loader!./tag.stories.scss';
import '../src/components/icons';

export const tags = () =>
  /*html*/
  `<div class="${story}">
    <p>Basic Tag</>
    <div class="tag">
      <span>Tag name</span>
    </div>

    <p>Edit Mode Tag</p>
    <div class="tag">
      <span class="tag-edit">
        Tag edit mode<meeco-icon icon="close"></meeco-icon>
      </span>
    </div>

    <p>Tag with Icon</p>
    <div class="tag">
      <span class="tag-icon">
        <meeco-icon icon="contactNew"></meeco-icon>
        Tag with Icon
      </span>
    </div>

  </div>`;
