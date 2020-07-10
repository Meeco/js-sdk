export default { title: 'Field Elements' };

import { story } from 'style-loader!./field-elements.stories.scss';
import '../src/components/icons';

const meecoIcons = icon => `<meeco-icon icon=${icon}></meeco-icon>`;

export const editMode = () => /*html*/ `
<div class=${story}>
  <p>Field elements in edit mode</p>
  <div class="container">
    <input type="text" value="Input field with text"/>
  </div>
</div>
`;
