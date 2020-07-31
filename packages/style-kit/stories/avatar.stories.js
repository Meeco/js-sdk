import mdx from './avatar.mdx';
import { story } from 'style-loader!./avatar.stories.scss';
import avatarImg from '../assets/avatar-img.png';

export default {
  title: 'Avatar',
  parameters: {
    docs: {
      page: mdx
    }
  }
};

export const avatar = () =>
  /*html*/
  `<div class=${story}>
      <p>Avatar Standard</p>

      <span class="avatar">ME</span>
      <span class="avatar">JV</span>
      <span class="avatar">KD</span>

      <p> Avatar Large </p>

      <span class="avatar large">ME</span>

      <p> Avatar Small </p>

      <span class="avatar small">ME</span>

      <p>Avatar Stack</p><br/>
      <p class="small"> Avatar stack can take the three avatar sizes - small, standard and large.</p>
      <p class="small"> The default avatar stack size to use is small.</p>

      <div class="avatar-stack">
        <div class="avatar small">ME</div>
        <div class="avatar small">KD</div>
        <div class="avatar small">JV</div>
        <div class="avatar small">+3</div>
      </div>

      <p class="small">An avatar stack can also take an image and initials, the image will take priority for display</p>

      <div class="avatar-stack">
        <div class="avatar small">ME</div>
        <div class="avatar small">JV<img class="avatar-img" src=${avatarImg}/></div>
        <div class="avatar small">KD</div>
      </div>

      <p class="small">For now the avatar stack has a default colour which can be set in the theme, to override add custom background color and font color</p>

      <div class="avatar-stack">
        <div class="avatar small" style="background-color:#F2FAEA; color:#7FC92B">ME</div>
        <div class="avatar small">JV<img class="avatar-img" src=${avatarImg}/></div>
        <div class="avatar small" style="background-color:#FBEAF3; color:#DB2C87;">KD</div>
        <div class="avatar small">+3</div>
      </div>

    </div>
  `;
