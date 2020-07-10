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
    <div class="tag edit">
      <span>Tag edit mode</span><meeco-icon icon="close"></meeco-icon>
    </div>

    <p>Tag with Icon</p>
    <div class="tag icon">
      <meeco-icon icon="contactNew"></meeco-icon><span>Tag with Icon</span>
    </div>

  </div>`;
