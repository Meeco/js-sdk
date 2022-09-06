import mdx from './avatar.mdx';
import styles from 'style-loader!./avatar.stories.scss';
import avatarImg from '../assets/avatar-img.png';

export default {
  title: 'Avatar',
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export const avatar = () =>
  /*html*/
  `<div class=${styles.story}>
      <p><span class="avatar small">ME</span>This is a small avatar</p>
      <p><span class="avatar">ME</span>This is a default avatar</p>
      <p><span class="avatar large">ME</span>This is a large avatar</p>
    </div>
  `;

export const avatarStack = () => /*html*/ `
  <div class=${styles.story}>
    <div class="avatar-stack">
      <div class="avatar small">ME</div>
      <div class="avatar small">JV<img class="avatar-img" src=${avatarImg}/></div>
      <div class="avatar small">KD</div>
    </div>

    <div class="avatar-stack">
      <div class="avatar small" style="background-color:#F2FAEA; color:#7FC92B">ME</div>
      <div class="avatar small">JV<img class="avatar-img" src=${avatarImg}/></div>
      <div class="avatar small" style="background-color:#FBEAF3; color:#DB2C87;">KD</div>
      <div class="avatar small">+3</div>
    </div>
  </div>`;
