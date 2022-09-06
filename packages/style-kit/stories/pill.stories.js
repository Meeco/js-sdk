import mdx from './pill.mdx';
import styles from 'style-loader!./pill.stories.scss';

export default {
  title: 'Pills and Tabs',
  parameters: { docs: { page: mdx } },
};

// const sampleColors = ['red', 'blue', 'grey', 'green'];

export const pill = () => /*html*/ `
<div class=${styles.story}>
  <span class="pill">A Simple Pill</span>
</div>`;

export const tabs = () => /*html*/ `
<div class=${styles.story}>
  <div class="tabs">
    <span class="tab selected">Selected Tab</span>
    <span class="tab">Un-selected Tab</span>
  </div>
</div>`;

export const pillsAndTabs = ({ background }) => {
  return /*html*/ `
  <div class="${styles.story}">
    <span class="pill">A Simple Pill</span>
  </div>

  <div class="${styles.story}">
    <div class="tabs">
      <span class="tab selected">Selected Tab</span>
      <span class="tab">Un-selected Tab</span>
    </div>
  </div>

  <div class="${styles.story}">
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

pillsAndTabs.argTypes = {
  background: { name: 'Background Color', defaultValue: '#e61e3d', control: 'color' },
};
