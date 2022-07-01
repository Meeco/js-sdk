import 'style-loader!./custom-themes.stories.scss';

export default { title: 'Custom Themes' };

export const customTheme = () => {
  return /*html*/ `
  <div class="story">
    <button class="primary">Primary Button</button>
    <button class="secondary">Secondary Button</button>

    <div class="card basic">
      <div class="content">
        <div class="icon"></div>
        <div>
          <p class="card-label">Card Label</p>
          <p class="subtitle">Sub-label (Optional)</p>
        </div>
      </div>
    </div>


    <label class="switch-input">
      <input type="checkbox" checked>
      <span class="slider"></span>
    </label>
  
    <label class="checkbox-input">
      <input type="checkbox" checked>
      <span class="checkmark"></span>
    </label>
    
    <label class="radio-button">
      <input type="radio" checked>
      <span class="checkmark"></span>
    </label>
    
  </div>
  `;
};
