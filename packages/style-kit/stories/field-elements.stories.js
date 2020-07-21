export default { title: 'Field Elements' };

import { story } from 'style-loader!./field-elements.stories.scss';
import placeholder from '../assets/image-placeholder.png';

export const editMode = () => /*html*/ `
<div class=${story}>
  <p>Field elements in edit mode</p>
  
  <div class="container">
    <input type="text" value="Input field with text"/>

    <input type="text" placeholder="Placeholder text"/>

    <label for="label">Label</label>
    <input name="label" type="text" value="Field value"/>

    <select class="dropdown-input">
      <option>Option 1</option>
      <option>Option 2</option>
      <option>Option 3</option>
    </select>

    <label>Date field label</label>
    <input type="date" placeholder="yyyy-mm-dd" />

    <input type="search" placeholder="Search placeholder"/>
  </div>

</div>
`;

export const viewMode = () => /*html*/ `
<div class=${story}>
  <p>Field elements in View Mode</p>

    <div class="container">
      <p class="label">Text Field Label</p>
      <p class="text-value">Text Value</p>
    </div>

    <div class="attachment">
      <div class="content">
        <div class="temp-icon">
          <img src=${placeholder} />
        </div>
        <p> Attachment Label </p>
      </div>
    </div>


</div>`;
