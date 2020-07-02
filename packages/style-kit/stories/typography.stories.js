export default { title: 'Typography' };

import 'style-loader!./typography.stories.scss';

export const font = () => `
<p><strong>Euclid Circular B</strong>, by the Swiss Typefaces foundry is the official
Meeco font to be used across all UI and marketing. To stay consistant, we only use
the Regular, Medium and Bold weights.</p>
`;

export const typographicStyles = () => `
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>

<p>Normal Body Text (Paragraph)</p>

<p class="large">Body Text Large</p>
<p class="medium">Body Text Medium</p>
<p class="small">Body Text Small</p>

<p class="card-label">Card Name Label</p>

<label>Text Field Label</label>

<input type="text" value="Text Field Value" />
`;
