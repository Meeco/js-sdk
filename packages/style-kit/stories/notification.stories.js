import mdx from './notification.mdx';
import styles from 'style-loader!./notification.stories.scss';

export default {
  title: 'Notifications',
  parameters: { docs: { page: mdx } },
};

export const notificationWithIcon = () => /*html*/ `
<div class=${styles.story}>
  <div class="notification" style="width:400px;">
    <div class="content">
        <i>tick-circled-reverse</i>
        <span>Default notification text</span>
        <button id="close-notification"><i>cross</i></button>
    </div>
  </div>
</div>`;

export const notificationWithText = () => /*html*/ `
<div class=${styles.story}>
  <div class="notification">
    <div class="content">
        <i>tick-circled-reverse</i>
        Default notification text
        <button id="close-notification">CANCEL</button>
    </div>
  </div>
</div>`;

export const Notifications = ({ notification, button, showIcon, showClose }) => {
  return /*html*/ `

<div class="${styles.story}">

  <p>Default Notification with icon button</p>

  <div class="notification" style="width:400px;">
    <div class="content">
        ${showIcon ? `<i>tick-circled-reverse</i>` : ''}
        <span>${notification}</span>
        ${showClose ? `<button id="close-notification"><i>cross</i></button>` : ''}
    </div>
  </div>

  <br><br>

  <p>Default Notification with text button</p>

  <div class="notification">
    <div class="content">
        ${showIcon ? `<i>tick-circled-reverse</i>` : ''}
        ${notification}
        <button id="close-notification">${button}</button>
    </div>
  </div>


</div>
`;
};

Notifications.args = {
  notification: 'Default notification text',
  button: 'Cancel',
  showIcon: true,
  showClose: true,
};
