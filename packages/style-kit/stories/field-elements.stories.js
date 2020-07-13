export default { title: 'Field Elements' };

import { story } from 'style-loader!./field-elements.stories.scss';
import '../src/components/icons';
import placeholder from '../assets/image-placeholder.png';

const dateField = () => {
  const today = new Date(Date.now());
  const dd = today.getDate();
  const mmm = today.toDateString().substring(4, 7);
  const yyyy = today.getFullYear();
  let hours = today.getHours();
  let minutes = today.getMinutes();
  const format = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return `${dd} ${mmm} ${yyyy}, ${hours}:${minutes}${format}`;
};

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
  </div>
</div>
`;

export const viewMode = () => /*html*/ `
<div class=${story}>
  <h3>Field elements in View Mode</h3>

    <div class="container">
      <p class="label">Text Field Label</p>
      <p class="text-value">Text Value</p>
    </div>

    <div class="attachment">
      <div class="content">
        <div class="icon">
          <img src=${placeholder} />
        </div>
        <p> Attachment Label </p>
      </div>
    </div>

    <div class="container">
      <p class="label">Date field label</p>
      <p class="date-value">${dateField()}</p>
    </div>

    <div class="container">
      <input type="search" placeholder="Search placeholder"/>
    </div>

</div>`;
