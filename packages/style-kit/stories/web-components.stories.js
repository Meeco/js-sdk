export default { title: 'Web Components' };

import '../src/components/hello-world';
import '../src/components/icons';

export const helloWorld = () => `<hello-world></hello-world>`;

export const meecoIcons = () => `<meeco-icon icon="share"></meeco-icon>`;
