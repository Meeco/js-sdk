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
                <div class="icon"><i>file-text</i></div>
                <p class="card-label">Travel details</p>
              </div>
            </div>
            <div class="card complex-footer">
              <div class="content">
                <div class="icon"><i>website</i></div>
                <p class="card-label">Wifi Password</p>
              </div>
              <div class="footer">
                <span class="tag-icon">sharing with <i class="sm">sharing</i></span>
                <div class="avatar-stack">
                  <div class="avatar small">ME</div>
                  <div class="avatar small">KD</div>
                  <div class="avatar small">+1</div>
                </div>
              </div>
            </div>
            <div class="card complex-footer">
              <div class="content">
                <div class="icon"><i>id</i></div>
                <p class="card-label">Spotify family account</p>
              </div>
              <div class="footer">
                <span class="tag-icon">shared from<i class="sm">shared</i></span>
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
                    <div class="icon"><i>website</i></div>
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
                <button class="icon-only"><i>cross</i></button>
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
                <div class="icon"><i>website</i></div>
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
                <div class="icon"><img src="https://picsum.photos/48"/></div>
                <p>Photo of wifi card</p>
              </div>
            </div>
          </div>
        </div>
       </div>

      <div class="component tile-list">
        <h4>Tile List Example</h4>
        <div class="tile">
         <div class="content">
          <div class="icon"><i>integrations</i></div>
           <p class="tile-label">Twitter</p>
           <span class="tag">connected</span>
         </div>
        </div>
        <div class="tile">
          <div class="content">
            <div class="icon"><i>integrations</i></div>
            <p class="tile-label">Twitter</p>
            <span class="tag">connected</span>
          </div>
        </div>
        <div class="tile">
          <div class="content">
            <div class="icon"><i>integrations</i></div>
            <p class="tile-label">Twitter</p>
            <span class="tag">connected</span>
          </div>
        </div>
        <div class="tile">
          <div class="content">
            <div class="icon"><i>integrations</i></div>
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

export const dashboardDemo = () => {
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
        <button class="icon-only"><i>add</i></button>
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
            <div class="icon"><i>website</i></div>
            <p class="card-label">Wifi Password</p>
          </div>
        </div>
        <div class="card">
          <div class="content">
            <div class="icon"><i>website</i></div>
            <p class="card-label">Wifi Password</p>
          </div>
        </div>
        <div class="card">
          <div class="content">
            <div class="icon"><i>website</i></div>
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
          <button class="icon-only smoke"><i>share</i></button>
        </div>
        <div class="inline">
          <button class="icon-only smoke"><i>edit</i></button>
          <button class="icon-only smoke"><i>duplicate</i></button>
        </div>
      </div>

      <div class="display">
        <div class="card-detail">
          <div class="card no-shadow">
            <div class="content">
              <div class="icon"><i>id</i></div>
              <p class="card-label">Spotify Family Account</p>
            </div>
          </div>
          <div class="subline">
            <span class="tag">Family</span>
            <span class="tag">Passwords</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
};

export const kitchenSink = () => {
  return /*html*/ `
  <div class="${story} sink-container">
    <div class="table-example">
      <h4>Table Example</h4>
      <table>
        <tr>
          <th>Application No.</th>
          <th>Name</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>21</td>
          <td>Jane</td>
          <td>Approved</td>
        </tr>
        <tr>
          <td>22</td>
          <td>John</td>
          <td>Approved</td>
        </tr>
        <tr>
          <td>23</td>
          <td>Jill</td>
          <td>Pending</td>
        </tr>
      </table>
    </div>

    <div class="list-example">
      <h4>List Examples</h4>
        <ol>
          <li>Download the app</li>
          <li>Scan QR code</li>
          <li>Consent to sharing</li>
        </ol>
        <ul>
          <li>Apply now with app</li>
          <li>Apply later with app</li>
          <li>Apply manually</li>
        </ul>
    </div>

    <div class="body-text-example">
      <h4> Paragraph </h4>
        <p><b>Normal</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sit amet mattis vulputate enim nulla aliquet.</p><br/>
        <p class="small"><b class="small">Small</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sit amet mattis vulputate enim nulla aliquet.</p>
    </div>

    <div class="form-example">
      <h4>Form example</h4>
      <form>
        <label for="name">Full Name</label>
        <input type="text" name="name" placeholder="Full Name"/>
        <label for="occupation">Occupation</label>
        <input type="text" name="occuptation" placeholder="Occuptation"/>
        <label class="radio-button">
          <input type="radio" name="gender" value="male">
          <span class="checkmark"></span>
          <label for="male">Male</label>
        </label><br/>
        <label class="radio-button">
          <input type="radio" name="gender" value="female">
          <span class="checkmark"></span>
          <label for="female">Female</label>
        </label><br/>
        <label class="radio-button">
          <input type="radio" name="gender" value="non-binary">
          <span class="checkmark"></span>
          <label for="non-binary">Non-binary</label>
        </label><br/>
        <button class="primary large">Submit</button>
      </form>
    </div>
  </div>`;
};
