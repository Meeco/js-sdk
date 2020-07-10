class MeecoIcons extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  icons = {
    share: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 12V12C4 15.7712 4 17.6569 5.17157 18.8284C6.34315 20 8.22876 20 12 20V20C15.7712 20 17.6569 20 18.8284 18.8284C20 17.6569 20 15.7712 20 12V12"
      stroke="#e61e3d"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8 7L12 3M12 3L16 7M12 3V15"
      stroke="#e61e3d"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
    search: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#A3B0B8" stroke-width="2" stroke-linecap="round"/>
  <path d="M21 21L17 17" stroke="#A3B0B8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
    close: `<svg width="13" height="13" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 7.99997L8.00003 19.9999M8.00003 7.99997L20 19.9999" stroke="#00677F" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
    contactNew: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 9C14 11.2091 12.2091 13 10 13C7.79086 13 6 11.2091 6 9C6 6.79086 7.79086 5 10 5C12.2091 5 14 6.79086 14 9Z" stroke="#00677F" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 11V17M15 14H21" stroke="#00677F" stroke-width="2" stroke-linecap="round"/>
    <path d="M3 19C3.72533 17.2823 6.58399 16 10 16C11.286 16 12.493 16.1817 13.5369 16.5" stroke="#00677F" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  };

  connectedCallback() {
    const { shadowRoot } = this;
    if (this.getAttribute('icon')) {
      shadowRoot.innerHTML = this.icons[this.getAttribute('icon')];
    } else {
      shadowRoot.innerHTML = 'MI';
    }
  }
}

if (customElements && !customElements.get('meeco-icon')) {
  customElements.define('meeco-icon', MeecoIcons);
}
