import { withKnobs, text } from '@storybook/addon-knobs';

export default { title: 'Meeco Icons', decorators: [withKnobs] };

export const meecoIcons = () => {
  const iconName = text('Icon Name', 'vault');

  return /*html*/ `

<div class="meeco-icons-demo">

  <h1>Meeco Icon Set</h1>

  <div>
    <p>
      <h2>Usage</h2>
    </p>
    <p>
      To use icons you can either use ligatures with an <strong>i</strong> tag or by passing in the icon class to a <strong>span</strong>.
    </p>
    <p>
      For example to show the <i>${iconName}</i> <em>${iconName}</em> icon use: 
    </p>
    <pre>&lt;i&gt;${iconName}&lt;/i&gt;</pre>
    <p>or:</p>
    <pre>&lt;span class="icon"&gt;${iconName}&lt;/span&gt;</pre>
    <p>
      <strong>Icon list:</strong>
      <br>
      Below is a list of all available icons. You can change the value in the "Knobs" tab below to update the code snippets above for easy copy-paste.
    </p>

    <table border="1" style="position:relative;display:block;height:150px;overflow-y:scroll;">
      <tr><th>Icon</th><th>Ligature value</th></tr>
      <tr><td><i>add-circled-reverse</i></td><td>add-circled-reverse</td></tr>
      <tr><td><i>add-circled</i></td><td>add-circled</td></tr>
      <tr><td><i>add</i></td><td>add</td></tr>
      <tr><td><i>alert-circled-reverse</i></td><td>alert-circled-reverse</td></tr>
      <tr><td><i>alert-circled</i></td><td>alert-circled</td></tr>
      <tr><td><i>alert-octagon-reverse</i></td><td>alert-octagon-reverse</td></tr>
      <tr><td><i>alert-octagon</i></td><td>alert-octagon</td></tr>
      <tr><td><i>alert-triangle-reverse</i></td><td>alert-triangle-reverse</td></tr>
      <tr><td><i>alert-triangle</i></td><td>alert-triangle</td></tr>
      <tr><td><i>arrow-down</i></td><td>arrow-down</td></tr>
      <tr><td><i>arrow-left</i></td><td>arrow-left</td></tr>
      <tr><td><i>arrow-right</i></td><td>arrow-right</td></tr>
      <tr><td><i>arrow-up</i></td><td>arrow-up</td></tr>
      <tr><td><i>attachment</i></td><td>attachment</td></tr>
      <tr><td><i>badge</i></td><td>badge</td></tr>
      <tr><td><i>calendar</i></td><td>calendar</td></tr>
      <tr><td><i>camera</i></td><td>camera</td></tr>
      <tr><td><i>card-stack</i></td><td>card-stack</td></tr>
      <tr><td><i>chevron-down-circled-reverse</i></td><td>chevron-down-circled-reverse</td></tr>
      <tr><td><i>chevron-down-circled</i></td><td>chevron-down-circled</td></tr>
      <tr><td><i>chevron-down</i></td><td>chevron-down</td></tr>
      <tr><td><i>chevron-left-circled-reverse</i></td><td>chevron-left-circled-reverse</td></tr>
      <tr><td><i>chevron-left-circled</i></td><td>chevron-left-circled</td></tr>
      <tr><td><i>chevron-left</i></td><td>chevron-left</td></tr>
      <tr><td><i>chevron-right-circled-reverse</i></td><td>chevron-right-circled-reverse</td></tr>
      <tr><td><i>chevron-right-circled</i></td><td>chevron-right-circled</td></tr>
      <tr><td><i>chevron-right</i></td><td>chevron-right</td></tr>
      <tr><td><i>chevron-up-circled-reverse</i></td><td>chevron-up-circled-reverse</td></tr>
      <tr><td><i>chevron-up-circled</i></td><td>chevron-up-circled</td></tr>
      <tr><td><i>chevron-up</i></td><td>chevron-up</td></tr>
      <tr><td><i>clipboard</i></td><td>clipboard</td></tr>
      <tr><td><i>contact-new</i></td><td>contact-new</td></tr>
      <tr><td><i>contact</i></td><td>contact</td></tr>
      <tr><td><i>contacts</i></td><td>contacts</td></tr>
      <tr><td><i>credit-card</i></td><td>credit-card</td></tr>
      <tr><td><i>cross-circled-reverse</i></td><td>cross-circled-reverse</td></tr>
      <tr><td><i>cross-circled</i></td><td>cross-circled</td></tr>
      <tr><td><i>cross</i></td><td>cross</td></tr>
      <tr><td><i>delete</i></td><td>delete</td></tr>
      <tr><td><i>download</i></td><td>download</td></tr>
      <tr><td><i>duplicate</i></td><td>duplicate</td></tr>
      <tr><td><i>edit</i></td><td>edit</td></tr>
      <tr><td><i>feed</i></td><td>feed</td></tr>
      <tr><td><i>field</i></td><td>field</td></tr>
      <tr><td><i>file-text</i></td><td>file-text</td></tr>
      <tr><td><i>file</i></td><td>file</td></tr>
      <tr><td><i>filter</i></td><td>filter</td></tr>
      <tr><td><i>hamburger-menu</i></td><td>hamburger-menu</td></tr>
      <tr><td><i>home</i></td><td>home</td></tr>
      <tr><td><i>id</i></td><td>id</td></tr>
      <tr><td><i>image</i></td><td>image</td></tr>
      <tr><td><i>info-circled-reverse</i></td><td>info-circled-reverse</td></tr>
      <tr><td><i>info-circled</i></td><td>info-circled</td></tr>
      <tr><td><i>integrations</i></td><td>integrations</td></tr>
      <tr><td><i>item</i></td><td>item</td></tr>
      <tr><td><i>kebab-circled-reverse</i></td><td>kebab-circled-reverse</td></tr>
      <tr><td><i>kebab-circled</i></td><td>kebab-circled</td></tr>
      <tr><td><i>kebab</i></td><td>kebab</td></tr>
      <tr><td><i>list</i></td><td>list</td></tr>
      <tr><td><i>login</i></td><td>login</td></tr>
      <tr><td><i>logout</i></td><td>logout</td></tr>
      <tr><td><i>me-filled</i></td><td>me-filled</td></tr>
      <tr><td><i>me-outlined</i></td><td>me-outlined</td></tr>
      <tr><td><i>me</i></td><td>me</td></tr>
      <tr><td><i>meatballs-circled-reverse</i></td><td>meatballs-circled-reverse</td></tr>
      <tr><td><i>meatballs-circled</i></td><td>meatballs-circled</td></tr>
      <tr><td><i>meatballs</i></td><td>meatballs</td></tr>
      <tr><td><i>meeco-free</i></td><td>meeco-free</td></tr>
      <tr><td><i>meeco</i></td><td>meeco</td></tr>
      <tr><td><i>notes</i></td><td>notes</td></tr>
      <tr><td><i>notification</i></td><td>notification</td></tr>
      <tr><td><i>qr-code</i></td><td>qr-code</td></tr>
      <tr><td><i>question-circled-reverse</i></td><td>question-circled-reverse</td></tr>
      <tr><td><i>question-circled</i></td><td>question-circled</td></tr>
      <tr><td><i>redo</i></td><td>redo</td></tr>
      <tr><td><i>refresh</i></td><td>refresh</td></tr>
      <tr><td><i>reminder</i></td><td>reminder</td></tr>
      <tr><td><i>remove-circled-reverse</i></td><td>remove-circled-reverse</td></tr>
      <tr><td><i>remove-circled</i></td><td>remove-circled</td></tr>
      <tr><td><i>remove</i></td><td>remove</td></tr>
      <tr><td><i>reorder</i></td><td>reorder</td></tr>
      <tr><td><i>scan</i></td><td>scan</td></tr>
      <tr><td><i>search</i></td><td>search</td></tr>
      <tr><td><i>settings</i></td><td>settings</td></tr>
      <tr><td><i>share</i></td><td>share</td></tr>
      <tr><td><i>shared</i></td><td>shared</td></tr>
      <tr><td><i>sharing</i></td><td>sharing</td></tr>
      <tr><td><i>tag</i></td><td>tag</td></tr>
      <tr><td><i>template</i></td><td>template</td></tr>
      <tr><td><i>tick-circled-reverse</i></td><td>tick-circled-reverse</td></tr>
      <tr><td><i>tick-circled</i></td><td>tick-circled</td></tr>
      <tr><td><i>tick</i></td><td>tick</td></tr>
      <tr><td><i>undo</i></td><td>undo</td></tr>
      <tr><td><i>vault</i></td><td>vault</td></tr>
      <tr><td><i>vault2</i></td><td>vault2</td></tr>
      <tr><td><i>verified-outline</i></td><td>verified-outline</td></tr>
      <tr><td><i>verified-reverse</i></td><td>verified-reverse</td></tr>
      <tr><td><i>wallet</i></td><td>wallet</td></tr>
      <tr><td><i>website</i></td><td>website</td></tr>
      <tr><td><i>zoom</i></td><td>zoom</td></tr>
    </table>

  </div>

  

</div>

  `;
};
