import { story } from 'style-loader!./icon.stories.scss';
import { withKnobs, select } from '@storybook/addon-knobs';

export default { title: 'Icons', decorators: [withKnobs] };

const icon_list = [
  'add-circled-reverse',
  'add-circled',
  'add',
  'alert-circled-reverse',
  'alert-circled',
  'alert-octagon-reverse',
  'alert-octagon',
  'alert-triangle-reverse',
  'alert-triangle',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'attachment',
  'badge',
  'calendar',
  'camera',
  'card-stack',
  'chevron-down-circled-reverse',
  'chevron-down-circled',
  'chevron-down',
  'chevron-left-circled-reverse',
  'chevron-left-circled',
  'chevron-left',
  'chevron-right-circled-reverse',
  'chevron-right-circled',
  'chevron-right',
  'chevron-up-circled-reverse',
  'chevron-up-circled',
  'chevron-up',
  'clipboard',
  'contact-new',
  'contact',
  'contacts',
  'credit-card',
  'cross-circled-reverse',
  'cross-circled',
  'cross',
  'delete',
  'download',
  'duplicate',
  'edit',
  'feed',
  'field',
  'file-text',
  'file',
  'filter',
  'hamburger-menu',
  'home',
  'id',
  'image',
  'info-circled-reverse',
  'info-circled',
  'integrations',
  'item',
  'kebab-circled-reverse',
  'kebab-circled',
  'kebab',
  'list',
  'login',
  'logout',
  'me-filled',
  'me-outlined',
  'me',
  'meatballs-circled-reverse',
  'meatballs-circled',
  'meatballs',
  'meeco-free',
  'meeco',
  'notes',
  'notification',
  'qr-code',
  'question-circled-reverse',
  'question-circled',
  'redo',
  'refresh',
  'reminder',
  'remove-circled-reverse',
  'remove-circled',
  'remove',
  'reorder',
  'scan',
  'search',
  'settings',
  'share',
  'shared',
  'sharing',
  'tag',
  'template',
  'tick-circled-reverse',
  'tick-circled',
  'tick',
  'undo',
  'vault',
  'vault2',
  'verified-outline',
  'verified-reverse',
  'wallet',
  'website',
  'zoom',
];

export const meecoIcons = () => {
  const iconName = select('Icon name', icon_list, 'vault');

  let iconTable =
    '<table class="fixed"><tr><th>Icon</th><th>Ligature value</th></tr></table><table>';

  icon_list.forEach(function (icon_name) {
    iconTable += '<tr><td><i>' + icon_name + '</i></td><td>' + icon_name + '</td></tr>';
  });

  iconTable += '</table>';

  return /*html*/ `

<div class=${story}>

  <h1>Meeco Icon Set</h1>

  <div class="row">

    <div class="col">
      <div class="fixed">
        <p>
          <h2>Usage</h2>
        </p>
        <p>
          To use icons you can either use ligatures with an <strong>i</strong> tag or by passing in the icon class to a <strong>span</strong>.
        </p>
        <p>
          For example to show the <i>${iconName}</i> <em>${iconName}</em> icon use: 
        </p>
        <br>
        <pre><span id="itag-value">&lt;i&gt;${iconName}&lt;/i&gt;</span></pre>
        <p>or:</p>
        <pre>&lt;span class="icon"&gt;${iconName}&lt;/span&gt;</pre>
        <br>
        <p>
          You can change the value in the "Knobs" tab below to update the code snippets above for easy copy-paste.
        </p>
      </div>
    </div>

    <div class="col">
      
      ${iconTable}
      
    </div>

  </div>
  

</div>

  `;
};
