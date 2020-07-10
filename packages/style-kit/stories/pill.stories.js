export default { title: 'Pills and Tabs' };
import { story } from 'style-loader!./pill.stories.scss';

const sampleColors = ['red', 'blue', 'grey', 'green'];

export const pillsAndTabs = () => /*html*/ `
  <div class="${story}">
    <span class="pill">A Simple Pill</span>
  </div>

  <div class="${story}">
    <div class="tabs">
      <span class="tab selected">Selected Tab</span>
      <span class="tab">Un-selected Tab</span>
    </div>
  </div>

  <div class="${story}">
    <div class="tab-background-samples">
      <p>Sample Background Colors</p>

      ${sampleColors
        .map(
          color => /*html*/ `
        <div class="sample ${color}">
          <div class="tabs">
            <span class="tab selected">Selected Tab</span>
            <span class="tab">Un-selected Tab</span>
          </div>
        </div>`
        )
        .join('')}
    </div>
  </div>
`;
