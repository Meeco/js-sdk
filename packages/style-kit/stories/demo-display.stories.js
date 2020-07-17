export default { title: 'Demo Display' };

import { story } from 'style-loader!./demo-display.stories.scss';

import { useEffect } from '@storybook/client-api';

import imagePlaceholder from '../assets/image-placeholder.png';

export const mobileScreens = () => {
  useEffect(() => {
    const tabs = document.getElementsByClassName('tab');
    const toggleTab = () => {
      tabs.forEach(tab => {
        tab.classList.contains('selected')
          ? tab.classList.remove('selected')
          : tab.classList.add('selected');
      });
    };
    tabs.forEach(tab => {
      tab.addEventListener('click', toggleTab);
    });
  });
  return /*html*/ `
  <div class="${story} mobile">

    <h1>Explore Meeco UI Components</h1>

    <div class="container">
      <div class="column 1">
        <div class="component card-list">
            <h4>Card List Example</h4>
            <div class="card">
              <div class="content">
                <div class="icon"></div>
                <p class="card-label">Travel details</p>
              </div>
            </div>
            <div class="card complex-footer">
              <div class="content">
                <div class="icon"></div>
                <p class="card-label">Wifi Password</p>
              </div>
              <div class="footer">
                <span class="tag-icon">sharing with</span>
                <div class="avatar-stack">
                  <div class="avatar small">ME</div>
                  <div class="avatar small">KD</div>
                  <div class="avatar small">+1</div>
                </div>
              </div>
            </div>
            <div class="card complex-footer">
              <div class="content">
                <div class="icon"></div>
                <p class="card-label">Spotify family account</p>
              </div>
              <div class="footer">
                <span class="tag-icon">shared from</span>
                <div>
                  <p class="small">Evelyn Wu</p>
                  <div class="avatar small">EW</div>
                </div>
              </div>
            </div>
          </div>

          <div class="component card-detail mg-top-negative">
            <h4 class="white">Popup Edit Example</h4>
            <div class="popup">
              <div class="header">
                <div class="card no-shadow">
                  <div class="content">
                    <div class="icon"></div>
                    <p class="card-label">Wifi Password</p>
                  </div>
                </div>
                <div>
                  <span class="tag">Passwords</span>
                  <span class="tag">Family</span>
                </div>
              </div>
              <div class="popup-body">
                <form>
                  <div>
                    <label for="field">Wifi name</label>
                    <input type="text"/>
                  </div>
                  <div>
                    <label>Wifi password</label>
                    <input type="text"/>
                  </div>
                  <div>
                    <label>Internet Provider</label>
                    <input type="text"/>
                  </div>
                </form>
              </div>
              <div class="toolbar">
                <button class="icon-only">X</button>
                <button class="primary large">Save</button>
              </div>
            </div>
          </div>

        </div>

    <div class="column 2">
      <div class="component card-detail">
        <h4 class="white">Popup View Example</h4>
        <div class="popup">
          <div class="header">
            <div class="card no-shadow">
              <div class="content">
                <div class="icon"></div>
                <p class="card-label">Wifi Password</p>
              </div>
            </div>
            <div>
              <span class="tag">Passwords</span>
              <span class="tag">Family</span>
            </div>
          </div>
          <div class="popup-body">
            <div class="item">
              <p class="label">Wifi name</p>
              <p class="text-value">TPCInternet-5G</p>
            </div>
            <div class="item">
              <p class="label">Wifi password</p>
              <p class="text-value">P@ssw0rd!</p>
            </div>
            <div class="item">
              <p class="label">Internet Provider</p>
              <p class="text-value">TPC Internet</p>
            </div>
            <div class="attachment">
              <div class="content">
                <div class="icon"><img src=${imagePlaceholder}/></div>
                <p>Photo of wifi card</p>
              </div>
            </div>
          </div>
        </div>
       </div>

      <div class="component tile-list">
        <h4>Tile List Example</h4>
        <div class="tile">
         <div class="icon"></div>
         <div class="content">
           <p class="tile-label">Twitter</p>
           <span class="tag">connected</span>
         </div>
        </div>
        <div class="tile">
          <div class="icon"></div>
          <div class="content">
            <p class="tile-label">Twitter</p>
            <span class="tag">connected</span>
          </div>
        </div>
        <div class="tile">
          <div class="icon"></div>
          <div class="content">
            <p class="tile-label">Twitter</p>
            <span class="tag">connected</span>
          </div>
        </div>
        <div class="tile">
          <div class="icon"></div>
          <div class="content">
            <p class="tile-label">Twitter</p>
            <span class="tag">connected</span>
          </div>
        </div>
      </div>

    </div>

    <div class="column 3">

        <div class="component card-detail">
        <h4 class="white">Contact List Example</h4>
        <div class="popup">
          <div class="header">
            <p class="text-value red">Select contacts to share with</p>
            <input type="search" placeholder="search"/>
          </div>
          <div class="contact-body">
            <div class="contact">
              <div class="avatar">RB</div>
              <p class="small">Ruby Baker</p>
            </div>
            <div class="contact">
              <div class="avatar">RB</div>
              <p class="small">Ruby Baker</p>
            </div>
            <div class="contact">
              <div class="avatar">RB</div>
              <p class="small">Ruby Baker</p>
            </div>
            <div class="contact">
              <div class="avatar">RB</div>
              <p class="small">Ruby Baker</p>
            </div>
            <div class="contact">
              <div class="avatar">RB</div>
              <p class="small">Ruby Baker</p>
            </div>
            <div class="contact">
              <div class="avatar">RB</div>
              <p class="small">Ruby Baker</p>
            </div>
          </div>
        </div>
      </div>

      <div class="component pillbar">
        <h4> Tab Navigation Example </h4>
        <div class="tabs">
          <span class="tab selected" id="tab">First Tab</span>
          <span class="tab" id="tab2">Second Tab</span>
        </div>
      </div>
    </div>
  </div>
  `;
};

export const webView = () => {
  return /*html*/ `
  <div class="${story} dashboard">
    <div class="sidebar">
      <ul>
        <li>Vault</li>
        <li>Activity Feed</li>
        <li>Contacts</li>
        <li>Integrations</li>
        <li>Settings</li>
        <li>Notifications</li>
      </ul>
    </div>

    <div class="vault">
      <div class="toolbar">
        <h3>Vault</h3>
        <button class="icon-only">+</button>
      </div>
      <div class="tabs">
        <span class="tab selected">My items</span>
        <span class="tab">Sharing with</span>
        <span class="tab">Shared</span>
      </div>
      <input type="search" placeholder="Search items"/>
      <div class="card-list">
        <div class="card">
          <div class="content">
            <div class="icon"></div>
            <p class="card-label">Wifi Password</p>
          </div>
        </div>
        <div class="card">
          <div class="content">
            <div class="icon"></div>
            <p class="card-label">Wifi Password</p>
          </div>
        </div>
        <div class="card">
          <div class="content">
            <div class="icon"></div>
            <p class="card-label">Wifi Password</p>
          </div>
        </div>
      </div>
    </div>
    <div class="main">
      <div class="toolbar">
        <div class="inline">
          <div class="avatar-stack">
            <div class="avatar">KD</div>
            <div class="avatar">ME</div>
            <div class="avatar">+3</div>
          </div>
          <button class="icon-only smoke"></button>
        </div>
        <div class="inline">
          <button class="icon-only smoke"></button>
          <button class="icon-only smoke"></button>
        </div>
      </div>

      <div class="display">
        <div class="card-detail">
          <div class="card no-shadow">
            <div class="content">
              <div class="icon"></div>
              <p class="card-label">Spotify Family Account</p>
            </div>
          </div>
          <div>
            <span class="tag">Family</span>
            <span class="tag">Passwords</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
};
