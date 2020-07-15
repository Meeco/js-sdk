import { story } from 'style-loader!./pill.stories.scss';
import { color, withKnobs } from '@storybook/addon-knobs';

export default { title: 'Pills and Tabs', decrators: [withKnobs] };

const sampleColors = ['red', 'blue', 'grey', 'green'];

export const pillsAndTabs = () => {
  const background = color('Background Color', '#e61e3d');
  return /*html*/ `
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
      <p>On a Background (change color below)</p>
      <div class="sample" style="background-color: ${background}">
        <div class="tabs">
          <span class="tab selected">Selected Tab</span>
          <span class="tab">Un-selected Tab</span>
        </div>
      </div>
    </div>
  </div>
`;
};
